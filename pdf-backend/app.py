from flask import Flask, request, jsonify
from flask_cors import CORS
import io
from pptx import Presentation
from docx import Document
import pdfplumber
import os
import sys
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)

# Try to import pytesseract, but make it optional
try:
    import pytesseract
    from PIL import Image
    TESSERACT_AVAILABLE = True
    
    # Get Tesseract path from environment variable
    tesseract_path = os.getenv('TESSERACT_PATH')
    if tesseract_path and os.path.exists(tesseract_path):
        pytesseract.pytesseract.tesseract_cmd = tesseract_path
        print(f"Using Tesseract from: {tesseract_path}")
    else:
        # Fallback to common paths if environment variable is not set
        possible_paths = [
            r'C:\Program Files\Tesseract-OCR\tesseract.exe',
            r'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe',
            r'C:\Tesseract-OCR\tesseract.exe',
            r'C:\Users\StevenJakeASOY\AppData\Local\Programs\Tesseract-OCR\tesseract.exe'
        ]
        
        tesseract_found = False
        for path in possible_paths:
            if os.path.exists(path):
                pytesseract.pytesseract.tesseract_cmd = path
                tesseract_found = True
                print(f"Found Tesseract at: {path}")
                break
        
        if not tesseract_found:
            print("Tesseract not found in common locations. Please set TESSERACT_PATH in .env file.")
            TESSERACT_AVAILABLE = False
        
except ImportError:
    TESSERACT_AVAILABLE = False
    print("Tesseract OCR is not available. Image processing will be disabled.")

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
        elif filename.endswith(('.png', '.jpg', '.jpeg', '.tiff', '.bmp')):
            if not TESSERACT_AVAILABLE:
                return jsonify({
                    'error': 'Tesseract OCR is not properly installed. Please ensure it is installed and added to PATH.'
                }), 400
            try:
                # Handle image files using OCR
                image = Image.open(io.BytesIO(file.read()))
                text = pytesseract.image_to_string(image)
                if not text.strip():
                    return jsonify({'error': 'No text could be extracted from the image. Please ensure the image is clear and contains readable text.'}), 400
            except Exception as e:
                print("OCR Error:", str(e))
                return jsonify({'error': f'Error processing image: {str(e)}'}), 500
        else:
            print("Unsupported file type:", filename)
            return jsonify({'error': 'Unsupported file type'}), 400
        return jsonify({'text': text})
    except Exception as e:
        print("Error extracting file:", e)
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(port=5001)
