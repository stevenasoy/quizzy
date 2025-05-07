from flask import Flask, request, jsonify
from flask_cors import CORS
import io
from pptx import Presentation
from docx import Document
import pdfplumber
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
# Configure CORS
CORS(app, resources={
    r"/*": {
        "origins": [
            "http://localhost:8080",  # Local development
            "https://quizzy-frontend.vercel.app",  # Production frontend
            "https://*.vercel.app"  # Any Vercel subdomain
        ],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

@app.route('/extract-file', methods=['POST'])
def extract_file():
    if 'file' not in request.files:
        print("No file uploaded")
        return jsonify({'error': 'No file uploaded'}), 400
        
    file = request.files['file']
    filename = file.filename.lower()
    print("Received file:", filename)
    
    try:
        if filename.endswith('.pdf'):
            with pdfplumber.open(io.BytesIO(file.read())) as pdf:
                text = ''
                for page in pdf.pages:
                    text += page.extract_text() or ''
                    text += '\n'
                    
        elif filename.endswith('.pptx'):
            prs = Presentation(io.BytesIO(file.read()))
            text = ''
            for slide in prs.slides:
                for shape in slide.shapes:
                    if hasattr(shape, "text"):
                        text += shape.text + '\n'
                        
        elif filename.endswith('.docx'):
            doc = Document(io.BytesIO(file.read()))
            text = ''
            for para in doc.paragraphs:
                text += para.text + '\n'
            for table in doc.tables:
                for row in table.rows:
                    for cell in row.cells:
                        text += cell.text + '\n'
                        
        else:
            print("Unsupported file type:", filename)
            return jsonify({'error': 'Unsupported file type'}), 400
            
        return jsonify({'text': text})
        
    except Exception as e:
        print("Error extracting file:", e)
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(port=5001)
