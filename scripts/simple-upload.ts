
import dotenv from 'dotenv';
import { google } from 'googleapis';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

async function upload() {
    const clientEmail = process.env.GOOGLE_DRIVE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_DRIVE_PRIVATE_KEY;
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    console.log('Using folder ID:', folderId);
    console.log('Using email:', clientEmail);

    const auth = new google.auth.JWT({
        email: clientEmail,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    const drive = google.drive({ version: 'v3', auth });

    try {
        console.log('Attempting to upload 0-byte file...');
        const res = await drive.files.create({
            requestBody: {
                name: 'zero-byte.txt',
                parents: [folderId!]
            },
            media: {
                mimeType: 'text/plain',
                body: ''
            },
            fields: 'id, name, webViewLink, size',
            supportsAllDrives: true
        });
        console.log('Upload success:', res.data);
    } catch (error: any) {
        console.error('Upload failed:', error.message);
        if (error.response) {
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

upload();
