from flask import Flask, request, jsonify
from flask_cors import CORS
import io
from pptx import Presentation
from docx import Document
import pdfplumber
import os
from dotenv import load_dotenv
import mimetypes

# Load environment variables
load_dotenv()

app = Flask(__name__)
# Configure CORS
CORS(app, resources={
    r"/*": {
        "origins": [
            "http://localhost:8080",  # Local development
            "http://localhost:5173",  # Vite dev server
            "https://quizzy-mocha-chi.vercel.app",  # Your frontend URL
            "https://*.vercel.app"  # Any Vercel subdomain
        ],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

def get_file_type(filename, content_type):
    """Determine file type from both filename and content type"""
    ext = filename.lower().split('.')[-1] if '.' in filename else ''
    if ext in ['doc', 'docx'] or 'word' in content_type:
        return 'docx'
    elif ext in ['ppt', 'pptx'] or 'powerpoint' in content_type:
        return 'pptx'
    elif ext == 'pdf' or 'pdf' in content_type:
        return 'pdf'
    elif ext == 'txt' or 'text/plain' in content_type:
        return 'txt'
    return None

@app.route('/extract-file', methods=['POST'])
def extract_file():
    if 'file' not in request.files:
        print("No file uploaded")
        return jsonify({'error': 'No file uploaded'}), 400
        
    file = request.files['file']
    if not file.filename:
        return jsonify({'error': 'No selected file'}), 400

    try:
        # Get file type using both filename and content type
        file_type = get_file_type(file.filename, file.content_type)
        if not file_type:
            return jsonify({'error': f'Unsupported file type: {file.filename}'}), 400

        # Read file content
        file_content = file.read()
        text = ''

        if file_type == 'pdf':
            try:
                with pdfplumber.open(io.BytesIO(file_content)) as pdf:
                    for page in pdf.pages:
                        extracted = page.extract_text()
                        if extracted:
                            text += extracted + '\n'
            except Exception as e:
                print(f"Error extracting PDF: {str(e)}")
                return jsonify({'error': f'Error processing PDF: {str(e)}'}), 500

        elif file_type == 'pptx':
            try:
                prs = Presentation(io.BytesIO(file_content))
                for slide in prs.slides:
                    for shape in slide.shapes:
                        if hasattr(shape, "text"):
                            text += shape.text + '\n'
            except Exception as e:
                print(f"Error extracting PPTX: {str(e)}")
                return jsonify({'error': f'Error processing PPTX: {str(e)}'}), 500

        elif file_type == 'docx':
            try:
                doc = Document(io.BytesIO(file_content))
                for para in doc.paragraphs:
                    text += para.text + '\n'
                for table in doc.tables:
                    for row in table.rows:
                        for cell in row.cells:
                            text += cell.text + '\n'
            except Exception as e:
                print(f"Error extracting DOCX: {str(e)}")
                return jsonify({'error': f'Error processing DOCX: {str(e)}'}), 500

        elif file_type == 'txt':
            try:
                text = file_content.decode('utf-8')
            except UnicodeDecodeError:
                try:
                    text = file_content.decode('latin-1')
                except Exception as e:
                    print(f"Error decoding text file: {str(e)}")
                    return jsonify({'error': 'Error processing text file'}), 500

        # Clean up the extracted text
        text = text.strip()
        if not text:
            return jsonify({'error': 'No text could be extracted from the file'}), 400

        return jsonify({'text': text})

    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(port=5001, debug=True)
