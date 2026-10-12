import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)


def generate_answer(context, question):

    context_text = "\n\n".join(context)

    prompt = f"""
You are a documentation assistant.

Answer ONLY using the provided context.

Context:
{context_text}

Question:
{question}
"""

    completion = client.chat.completions.create(

        model="llama-3.1-8b-instant",

        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    return completion.choices[0].message.content