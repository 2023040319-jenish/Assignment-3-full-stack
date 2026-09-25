Q1 - USER REGISTRATION USING EXPRESS

Requirements:
- Express
- EJS
- express-validator
- Multer for single/multiple file upload
- Validation
- Previous text/password/radio/checkbox values remain after invalid submission
- Uploaded images displayed after successful submission
- Registration details and images displayed in a results table
- Individual image downloads remain available; registration-data downloads are not available

RUN:
1. Open terminal in this folder.
2. Run:
   npm install
3. Run:
   npm start
4. Open:
   http://localhost:3000

IMPORTANT:
- Browser security prevents Express from automatically repopulating file input fields.
- Profile picture: exactly 1 required.
- Other pictures: at least 1 and maximum 5.
- Maximum image size: 2 MB each.
- Registration JSON is saved in data/.
- Uploaded images are saved in uploads/.
- Passwords are not included in the saved registration JSON.
