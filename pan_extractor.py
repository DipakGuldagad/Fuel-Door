import os
import cv2
import pandas as pd
import re
import easyocr
import numpy as np
import ssl

try:
    _create_unverified_https_context = ssl._create_unverified_context
except AttributeError:
    pass
else:
    ssl._create_default_https_context = _create_unverified_https_context

class PANExtractor:
    def __init__(self, images_dir, labels_dir, output_csv="results.csv", debug_dir="debug_output"):
        self.images_dir = images_dir
        self.labels_dir = labels_dir
        self.output_csv = output_csv
        self.debug_dir = debug_dir
        
        # Initialize EasyOCR reader for English
        print("Initializing EasyOCR...")
        try:
            self.reader = easyocr.Reader(['en'], gpu=True, verbose=False) 
        except Exception as e:
            print(f"GPU initialization failed, falling back to CPU: {e}")
            self.reader = easyocr.Reader(['en'], gpu=False, verbose=False)

        # Ensure debug directory exists
        os.makedirs(self.debug_dir, exist_ok=True)

        # Class IDs from notes.json
        self.CLASS_ID_NAME = 0
        self.CLASS_ID_PAN = 2

    def load_data(self):
        """Pairs images with their corresponding label files."""
        pairs = []
        valid_extensions = {".jpg", ".jpeg", ".png", ".bmp"}
        
        # Get all image files
        try:
            image_files = [f for f in os.listdir(self.images_dir) if os.path.splitext(f)[1].lower() in valid_extensions]
        except FileNotFoundError:
            print(f"Error: Image directory '{self.images_dir}' not found.")
            return []

        for img_file in image_files:
            basename = os.path.splitext(img_file)[0]
            label_file = basename + ".txt"
            label_path = os.path.join(self.labels_dir, label_file)
            
            if os.path.exists(label_path):
                pairs.append((os.path.join(self.images_dir, img_file), label_path))
            else:
                pass
        
        return pairs

    def get_roi(self, image, bbox):
        """
        Converts YOLO normalized bbox (x_center, y_center, width, height) to pixel coordinates.
        Returns the cropped ROI.
        """
        h, w = image.shape[:2]
        x_center, y_center, width, height = bbox
        
        # Convert to pixel coordinates (top-left x, top-left y, box width, box height)
        x_min = int((x_center - width / 2) * w)
        y_min = int((y_center - height / 2) * h)
        box_w = int(width * w)
        box_h = int(height * h)
        
        # Clip coordinates to be within image bounds
        x_min = max(0, x_min)
        y_min = max(0, y_min)
        x_max = min(w, x_min + box_w)
        y_max = min(h, y_min + box_h)
        
        if x_max <= x_min or y_max <= y_min:
            return None

        return image[y_min:y_max, x_min:x_max]

    def preprocess_roi(self, roi):
        """
        Applies preprocessing to the ROI to improve OCR accuracy.
        1. Grayscale
        2. Resize (upscale if too small)
        3. Adaptive Thresholding / Contrast enhancement
        """
        if roi is None or roi.size == 0:
            return None

        # Convert to grayscale
        gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)

        # Upscale if the image is small
        if gray.shape[0] < 50:
            scale = 2
            gray = cv2.resize(gray, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)

        # Denoising
        gray = cv2.fastNlMeansDenoising(gray, None, 10, 7, 21)
        
         # Increase contrast
        alpha = 1.5 # Contrast control (1.0-3.0)
        beta = 0 # Brightness control (0-100)
        gray = cv2.convertScaleAbs(gray, alpha=alpha, beta=beta)
        
        return gray

    def perform_ocr(self, roi):
        """Runs EasyOCR on the ROI and returns the joined text."""
        if roi is None:
            return ""
        
        # detail=0 returns just the list of text strings found
        result = self.reader.readtext(roi, detail=0, paragraph=True) # paragraph=True helps join lines
        return " ".join(result).strip()

    def validate_pan(self, text):
        """
        Validates PAN using regex: [A-Z]{5}[0-9]{4}[A-Z]
        Returns the valid PAN or None.
        """
        # Remove spaces and non-alphanumeric characters for validation check
        clean_text = re.sub(r'[^A-Z0-9]', '', text.upper())
        
        # Search for the pattern in the cleaned text
        match = re.search(r'[A-Z]{5}[0-9]{4}[A-Z]', clean_text)
        if match:
            return match.group(0)
        return None

    def clean_name(self, text):
        """
        Cleans up the name string.
        Removes common headers like "Name", "Father's Name".
        """
        # Dictionary of words to remove (case insensitive)
        remove_words = ["name", "father's", "parent's", "signature", "identity", "card", "permanent", "account", "number", "govt", "india"]
        
        lines = text.split('\n')
        cleaned_lines = []
        for line in lines:
            words = line.split()
            filtered_words = [w for w in words if w.lower().strip(".:,") not in remove_words]
            if filtered_words:
                cleaned_lines.append(" ".join(filtered_words))
        
        return " ".join(cleaned_lines).strip()

    def process(self):
        """Main processing loop."""
        pairs = self.load_data()
        print(f"Found {len(pairs)} image-label pairs.")
        
        results = []
        
        for img_path, label_path in pairs:
            # print(f"Processing {os.path.basename(img_path)}...")
            
            try:
                image = cv2.imread(img_path)
                if image is None:
                    print(f"Failed to read image: {img_path}")
                    continue

                with open(label_path, 'r') as f:
                    labels = f.readlines()
                
                pan_text = ""
                name_text = ""
                
                found_pan = False
                found_name = False

                for line in labels:
                    parts = list(map(float, line.strip().split()))
                    class_id = int(parts[0])
                    bbox = parts[1:] # x, y, w, h
                    
                    if class_id == self.CLASS_ID_PAN and not found_pan:
                        roi = self.get_roi(image, bbox)
                        processed_roi = self.preprocess_roi(roi)
                        raw_text = self.perform_ocr(processed_roi)
                        valid_pan = self.validate_pan(raw_text)
                        
                        if valid_pan:
                            pan_text = valid_pan
                            found_pan = True
                            # Save debug image
                            cv2.imwrite(os.path.join(self.debug_dir, f"pan_{os.path.basename(img_path)}"), processed_roi)

                    elif class_id == self.CLASS_ID_NAME and not found_name:
                         # For names, sometimes the box is just the name, sometimes includes "Name" label.
                        roi = self.get_roi(image, bbox)
                        processed_roi = self.preprocess_roi(roi)
                        raw_text = self.perform_ocr(processed_roi)
                        clean_name_text = self.clean_name(raw_text)
                        
                        if len(clean_name_text) > 2: # heuristic: name must be at least 3 chars
                            name_text = clean_name_text
                            found_name = True
                            # Save debug image
                            cv2.imwrite(os.path.join(self.debug_dir, f"name_{os.path.basename(img_path)}"), processed_roi)

                if pan_text:
                    # Only save if we found a valid PAN. Name is optional but desired.
                    results.append({
                        "PAN_NUMBER": pan_text,
                        "FULL_NAME": name_text,
                        "Image": os.path.basename(img_path)
                    })
                    print(f" [SUCCESS] {os.path.basename(img_path)} -> PAN: {pan_text}, Name: {name_text}")
                else:
                    print(f" [SKIP] {os.path.basename(img_path)} -> Valid PAN not found.")

            except Exception as e:
                print(f"Error processing {img_path}: {e}")
                continue

        # Save to CSV
        if results:
            df = pd.DataFrame(results)
            # Reorder columns
            df = df[["PAN_NUMBER", "FULL_NAME", "Image"]]
            df.to_csv(self.output_csv, index=False)
            print(f"\nExtraction complete. Results saved to {self.output_csv}")
            print(f"Total processed: {len(pairs)}")
            print(f"Total valid extracted: {len(results)}")
        else:
            print("\nNo valid data extracted.")

if __name__ == "__main__":
    # Configure paths
    BASE_DIR = r"C:\Users\Dipak\Fuel@Door\archive"
    IMAGES_DIR = os.path.join(BASE_DIR, "images-high-res")
    LABELS_DIR = os.path.join(BASE_DIR, "labels-high-res")
    OUTPUT_CSV = os.path.join(BASE_DIR, "extracted_pan_data.csv")
    
    extractor = PANExtractor(IMAGES_DIR, LABELS_DIR, OUTPUT_CSV)
    extractor.process()
