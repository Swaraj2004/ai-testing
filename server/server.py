import base64
import json
import os

import anthropic
import google.generativeai as gemini
import pdfplumber
import spacy
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from openai import OpenAI
from openai.types.beta.threads.message_create_params import (
    Attachment, AttachmentToolFileSearch)

load_dotenv()

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024
cors = CORS(app, resources={r"/api/*": {"origins": "*"}})

anthropic_client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
gemini.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Load the spaCy language model
nlp = spacy.load("en_core_web_sm")

# Function to preprocess text using spaCy
def preprocess_text_remove_repetitions(text):
    doc = nlp(text)
    unique_sentences = []
    seen = set()

    for sent in doc.sents:
        normalized_sentence = sent.text.strip()
        if normalized_sentence not in seen:
            seen.add(normalized_sentence)
            unique_sentences.append(normalized_sentence)

    return " ".join(unique_sentences)

# Function to extract text from a PDF using pdfplumber
def extract_text_pdfplumber(pdf_path):
    with pdfplumber.open(pdf_path) as pdf:
        text = ""
        for page in pdf.pages:
            text += page.extract_text() + "\n"
    return text.strip()

# Function to process PDF with pdfplumber + spaCy
def extract_text_with_spacy(pdf_path):
    text = extract_text_pdfplumber(pdf_path)
    return preprocess_text_remove_repetitions(text)

def psv_to_json(psv_data):
    # Split the PSV data into lines
    lines = psv_data.strip().split("\n")
    
    # Skip the header row
    header = lines[0].split("|")
    data_lines = lines[1:]
    
    # Convert each line into a dictionary
    json_array = []
    for line in data_lines:
        fields = [field.strip() for field in line.split("|")]
        json_object = {key.strip(): fields[i] for i, key in enumerate(header)}
        json_array.append(json_object)
    
    return json.dumps(json_array, indent=4)

prompt = """
Extract Data from the Report and provide the output strictly in Pipe-Separated Values (PSV) format with 3 columns: test, observation, and unit.
Do not include any additional lines, explanations, or text in the response. Use the following structure:
test|observation|unit
Include above line as header and respond as plain text and dont wrap in quotes.
If any value, unit, or reference interval is not explicitly mentioned in the report, use "NA" and if any value has Pipe symbol then remove it.
Keep the test names exactly as written in the report, preserving their original order. Do not repeat or omit any test.
Ensure the output is error-free and strictly adheres to the PSV format.

"""

# Function to process PDF with OpenAI
def response_with_openai(pdf_path, model_name, method):
    if method == "pdfplumber":
        try:
            text = extract_text_pdfplumber(pdf_path)
            custom_prompt = prompt + f"""Report: {text}"""
            response = openai_client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "user", "content": custom_prompt}
                ]
            )
            return response
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    elif method == "pdfplumber_spacy":
        try:
            text = extract_text_with_spacy(pdf_path)
            custom_prompt = prompt + f"""Report: {text}"""
            response = openai_client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "user", "content": custom_prompt}
                ]
            )
            return response
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    elif method == "direct_pdf":
        try:
            file = open(pdf_path, "rb")
            response = openai_client.beta.assistants.create(
                model=model_name,
                description="An assistant to extract the contents of PDF files.",
                tools=[{"type": "file_search"}],
                name="PDF assistant",
            )
            # Create thread
            thread = openai_client.beta.threads.create()
            # Upload the file
            uploaded_file = openai_client.files.create(file=file, purpose="assistants")
            # Create assistant
            openai_client.beta.threads.messages.create(
                thread_id=thread.id,
                role="user",
                attachments=[
                    Attachment(
                        file_id=uploaded_file.id, tools=[AttachmentToolFileSearch(type="file_search")]
                    )
                ],
                content=prompt,
            )
            # Run thread
            run = openai_client.beta.threads.runs.create_and_poll(
                thread_id=thread.id, assistant_id=response.id, timeout=1000
            )
            if run.status != "completed":
                raise Exception("Run failed:", run.status)
            messages_cursor = openai_client.beta.threads.messages.list(thread_id=thread.id)
            messages = [message for message in messages_cursor]
            # Output text
            res_txt = messages[0].content[0].text.value
            json_output = psv_to_json(res_txt)
            return {
                "result": json_output,
                "input_tokens": str(run.usage.prompt_tokens),
                "output_tokens": str(run.usage.completion_tokens)
            }
        except Exception as e:
            return {"error": str(e)}

# Function to process PDF with Google Generative AI
def response_with_gemini(pdf_path, model_name, method):
    if method == "pdfplumber":
        try:
            text = extract_text_pdfplumber(pdf_path)
            custom_prompt = prompt + f"""Report: {text}"""
            model = gemini.GenerativeModel(model_name)
            response = model.generate_content(custom_prompt)
            return response
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    elif method == "pdfplumber_spacy":
        try:
            text = extract_text_with_spacy(pdf_path)
            custom_prompt = prompt + f"""Report: {text}"""
            model = gemini.GenerativeModel(model_name)
            response = model.generate_content(custom_prompt)
            return response
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    elif method == "direct_pdf":
        try:
            with open(pdf_path, "rb") as doc_file:
                doc_data = base64.standard_b64encode(doc_file.read()).decode("utf-8")
            model = gemini.GenerativeModel(model_name)
            response = model.generate_content(
                [
                    {'mime_type': 'application/pdf', 'data': doc_data},
                    prompt
                ]
            )
            return response
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
# Function to process PDF with Anthropic
def response_with_anthropic(pdf_path, model_name, method):
    if method == "pdfplumber":
        try:
            text = extract_text_pdfplumber(pdf_path)
            custom_prompt = prompt + f"""Report: {text}"""
            response = anthropic_client.messages.create(
                model=model_name,
                max_tokens=4000,
                messages=[
                    {"role": "user", "content": custom_prompt}
                ]
            )
            return response
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    elif method == "pdfplumber_spacy":
        try:
            text = extract_text_with_spacy(pdf_path)
            custom_prompt = prompt + f"""Report: {text}"""
            response = anthropic_client.messages.create(
                model=model_name,
                max_tokens=4000,
                messages=[
                    {"role": "user", "content": custom_prompt}
                ]
            )
            return response
        except Exception as e:
            return jsonify({"error": str(e)}), 500

# Load the JSON data
with open("ai_models.json", "r") as file:
    ai_models = json.load(file)

# Define the API endpoint
@app.route('/api/ai-models', methods=['GET'])
def get_ai_models():
    return jsonify(ai_models)

# Route to process the uploaded PDF file
@app.route("/api/get-table", methods=["POST"])
def process_pdf():
    # Parse request
    ai_name = request.form.get("ai")
    model_name = request.form.get("model")
    method = request.form.get("method")
    pdf_file = request.files.get("pdf")

    # Validate inputs
    if not model_name or not method or not pdf_file:
        return jsonify({"error": "Missing required parameters: model, method, or pdf"}), 400

    # Ensure the temp folder exists
    temp_dir = "temp"
    if not os.path.exists(temp_dir):
        os.makedirs(temp_dir)
    temp_pdf_path = os.path.join(temp_dir, pdf_file.filename)

    try:
        # Save the uploaded PDF file temporarily
        pdf_file.save(temp_pdf_path)

        if ai_name == "openai":
            if method in ["pdfplumber", "pdfplumber_spacy"]:
                api_response = response_with_openai(temp_pdf_path, model_name, method)
                json_output = psv_to_json(api_response.choices[0].message.content)
                response = {
                    "result": json_output,
                    "input_tokens": str(api_response.usage.prompt_tokens),
                    "output_tokens": str(api_response.usage.completion_tokens),
                }
            elif method == "direct_pdf":
                response = response_with_openai(temp_pdf_path, model_name, method)
        elif ai_name == "gemini":
            api_response = response_with_gemini(temp_pdf_path, model_name, method)
            json_output = psv_to_json(api_response.text)
            response = {
                "result": json_output,
                "input_tokens": str(api_response.usage_metadata.prompt_token_count),
                "output_tokens": str(api_response.usage_metadata.candidates_token_count),
            }
        elif ai_name == "claude":
            api_response = response_with_anthropic(temp_pdf_path, model_name, method)
            json_output = psv_to_json(api_response.content[0].text)
            response = {
                "result": json_output,
                "input_tokens": str(api_response.usage.input_tokens),
                "output_tokens": str(api_response.usage.output_tokens),
            }
        else:
            return jsonify({"error": "Invalid AI name"}), 400

        return jsonify(response)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        # Remove the temporary file after processing
        if os.path.exists(temp_pdf_path):
            os.remove(temp_pdf_path)


# Run the Flask app
if __name__ == '__main__':
    app.run(debug=True)
