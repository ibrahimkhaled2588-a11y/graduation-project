import os

import chromadb

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# GitHub Models endpoint — used when GITHUB_TOKEN is set
GITHUB_MODELS_ENDPOINT = "https://models.inference.ai.azure.com"

_RAG_TEMPLATE = '''Use the following pieces of context to answer the question at the end.
If you don't know the answer, say that you don't know; do not invent medical advice.
{context}

Question: {question}
Answer in clear English:
'''

_SYSTEM_PROMPT = """You are Shifaa, an expert AI cardiovascular health assistant.
You help users understand cardiovascular diseases including stroke, coronary heart disease (CHD), and myocardial infarction (MI/heart attack).

You can answer questions about:
- Risk factors for cardiovascular diseases (age, smoking, hypertension, diabetes, cholesterol, BMI, genetics)
- Prevention strategies and healthy lifestyle changes
- Symptoms and warning signs of stroke, CHD, and heart attack
- Medical tests: ECG, troponin, CK-MB, cholesterol panels, blood pressure readings
- What prediction results from the Shifaa detectors mean
- When to urgently seek medical attention
- Diet and exercise recommendations for heart health
- Understanding terms like systolic/diastolic pressure, arrhythmia, angina, atrial fibrillation

Always:
- Give clear, accurate, and compassionate answers
- Remind users to consult a healthcare professional for personal medical decisions
- Never diagnose or prescribe treatment
- Immediately flag symptoms that need emergency care (chest pain radiating to arm/jaw, sudden numbness, slurred speech, difficulty breathing)
"""


def _get_credentials():
    """Return (api_key, base_url, model) based on available env vars."""
    github_token = os.environ.get('GITHUB_TOKEN', '').strip()
    openai_key = os.environ.get('OPENAI_API_KEY', '').strip()

    if github_token and not github_token.startswith('YOUR_'):
        return github_token, GITHUB_MODELS_ENDPOINT, 'gpt-4o-mini'
    if openai_key and not openai_key.startswith('sk-o5AWY'):
        return openai_key, None, 'gpt-3.5-turbo'
    return None, None, None


class ChatBotManager:
    def __init__(self) -> None:
        self._qa = None       # LangChain RAG chain (when shifaa_VDB exists)
        self._llm = None      # ChatOpenAI direct client (fallback)
        self._mode = None     # 'rag' | 'direct'
        self._init_error = None

    def _ensure_ready(self):
        if self._qa is not None or self._llm is not None:
            return
        if self._init_error:
            raise RuntimeError(self._init_error)

        api_key, base_url, model = _get_credentials()
        if not api_key:
            self._init_error = (
                'Chatbot is not configured. '
                'Add GITHUB_TOKEN to Application/.env with your GitHub personal access token.'
            )
            raise RuntimeError(self._init_error)

        vdb_path = os.path.join(BASE_DIR, 'shifaa_VDB')
        if os.path.isdir(vdb_path) and base_url is None:
            # RAG mode only works with a direct OpenAI key (not GitHub proxy)
            self._init_rag(api_key, vdb_path)
        else:
            self._init_direct(api_key, base_url, model)

    def _init_rag(self, api_key, vdb_path):
        from langchain_chroma import Chroma
        from langchain_core.prompts import PromptTemplate
        from langchain_core.runnables import RunnablePassthrough
        from langchain_openai import OpenAI, OpenAIEmbeddings

        try:
            embedding_func = OpenAIEmbeddings(
                model='text-embedding-3-small',
                api_key=api_key,
            )
            persistent_client = chromadb.PersistentClient(vdb_path)
            db = Chroma(
                client=persistent_client,
                collection_name='main_collection',
                embedding_function=embedding_func,
            )
            prompt = PromptTemplate(
                template=_RAG_TEMPLATE,
                input_variables=['context', 'question'],
            )
            retriever = db.as_retriever(search_type='similarity', search_kwargs={'k': 2})
            llm = OpenAI(model_name='gpt-3.5-turbo-instruct', temperature=0, api_key=api_key)
            self._qa = (
                {'context': retriever, 'question': RunnablePassthrough()}
                | prompt
                | llm
            )
            self._mode = 'rag'
        except Exception as exc:
            self._init_error = f'RAG initialization failed: {exc}'
            raise RuntimeError(self._init_error) from exc

    def _init_direct(self, api_key, base_url, model):
        from langchain_openai import ChatOpenAI

        kwargs = dict(model=model, temperature=0.3, api_key=api_key)
        if base_url:
            kwargs['base_url'] = base_url

        try:
            self._llm = ChatOpenAI(**kwargs)
            self._mode = 'direct'
        except Exception as exc:
            self._init_error = f'Chatbot initialization failed: {exc}'
            raise RuntimeError(self._init_error) from exc

    def generate_answer(self, question: str) -> str:
        from langchain_core.messages import HumanMessage, SystemMessage

        self._ensure_ready()

        if self._mode == 'rag':
            result = self._qa.invoke(question)
            text = result if isinstance(result, str) else str(getattr(result, 'content', result))
            return text.strip()

        messages = [
            SystemMessage(content=_SYSTEM_PROMPT),
            HumanMessage(content=question),
        ]
        result = self._llm.invoke(messages)
        return result.content.strip()
