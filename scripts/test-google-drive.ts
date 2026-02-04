#!/usr/bin/env tsx

/**
 * Test script for Google Drive connection
 * 
 * Usage:
 *   npx tsx scripts/test-google-drive.ts
 */

import dotenv from 'dotenv';
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config({ path: '.env.local' });

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

interface TestResult {
    test: string;
    status: 'PASS' | 'FAIL';
    message: string;
    details?: any;
}

const results: TestResult[] = [];

function logTest(result: TestResult) {
    results.push(result);
    const icon = result.status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} ${result.test}: ${result.message}`);
    if (result.details) {
        console.log('   Details:', JSON.stringify(result.details, null, 2));
    }
}

async function testEnvironmentVariables() {
    console.log('\n📋 Testing Environment Variables...\n');

    const clientEmail = process.env.GOOGLE_DRIVE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_DRIVE_PRIVATE_KEY;
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    if (!clientEmail) {
        logTest({
            test: 'GOOGLE_DRIVE_CLIENT_EMAIL',
            status: 'FAIL',
            message: 'Environment variable not set'
        });
        return false;
    }

    logTest({
        test: 'GOOGLE_DRIVE_CLIENT_EMAIL',
        status: 'PASS',
        message: clientEmail
    });

    if (!privateKey) {
        logTest({
            test: 'GOOGLE_DRIVE_PRIVATE_KEY',
            status: 'FAIL',
            message: 'Environment variable not set'
        });
        return false;
    }

    // Check if private key format is correct
    if (!privateKey.includes('BEGIN PRIVATE KEY')) {
        logTest({
            test: 'GOOGLE_DRIVE_PRIVATE_KEY',
            status: 'FAIL',
            message: 'Invalid format (missing BEGIN PRIVATE KEY)'
        });
        return false;
    }

    logTest({
        test: 'GOOGLE_DRIVE_PRIVATE_KEY',
        status: 'PASS',
        message: 'Set and formatted correctly'
    });

    if (!folderId) {
        logTest({
            test: 'GOOGLE_DRIVE_FOLDER_ID',
            status: 'FAIL',
            message: 'Environment variable not set'
        });
        return false;
    }

    logTest({
        test: 'GOOGLE_DRIVE_FOLDER_ID',
        status: 'PASS',
        message: folderId
    });

    return true;
}

function getDriveClient() {
    const clientEmail = process.env.GOOGLE_DRIVE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_DRIVE_PRIVATE_KEY;

    if (!clientEmail || !privateKey) {
        throw new Error('Google Drive credentials not configured');
    }

    const auth = new google.auth.JWT({
        email: clientEmail,
        key: privateKey,
        scopes: SCOPES,
    });

    return google.drive({ version: 'v3', auth });
}

async function testAuthentication() {
    console.log('\n🔐 Testing Authentication...\n');

    try {
        const drive = getDriveClient();

        // Test by getting user info (about)
        const response = await drive.about.get({
            fields: 'user, storageQuota'
        });

        logTest({
            test: 'Authentication',
            status: 'PASS',
            message: 'Successfully authenticated with Google Drive',
            details: {
                user: response.data.user?.emailAddress,
                storage: response.data.storageQuota
            }
        });

        return true;
    } catch (error: any) {
        logTest({
            test: 'Authentication',
            status: 'FAIL',
            message: error.message,
            details: error
        });
        return false;
    }
}

async function testFolderAccess() {
    console.log('\n📁 Testing Folder Access...\n');

    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    if (!folderId) {
        logTest({
            test: 'Folder Access',
            status: 'FAIL',
            message: 'GOOGLE_DRIVE_FOLDER_ID not set'
        });
        return false;
    }

    try {
        const drive = getDriveClient();

        // Get folder metadata
        const response = await drive.files.get({
            fileId: folderId,
            fields: 'id, name, mimeType, permissions, owners',
            supportsAllDrives: true
        });

        const folder = response.data;

        if (folder.mimeType !== 'application/vnd.google-apps.folder') {
            logTest({
                test: 'Folder Access',
                status: 'FAIL',
                message: 'ID does not point to a folder',
                details: { mimeType: folder.mimeType }
            });
            return false;
        }

        logTest({
            test: 'Folder Access',
            status: 'PASS',
            message: `Successfully accessed folder: ${folder.name}`,
            details: {
                id: folder.id,
                name: folder.name,
                owners: folder.owners
            }
        });

        return true;
    } catch (error: any) {
        logTest({
            test: 'Folder Access',
            status: 'FAIL',
            message: error.message,
            details: error
        });
        return false;
    }
}

async function testFileUpload() {
    console.log('\n⬆️  Testing File Upload...\n');

    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    try {
        const drive = getDriveClient();

        // Create a test file
        const testContent = `Google Drive Test File\nCreated at: ${new Date().toISOString()}\n`;
        const buffer = Buffer.from(testContent, 'utf-8');

        const fileMetadata = {
            name: `test-${Date.now()}.txt`,
            parents: [folderId!]
        };

        const media = {
            mimeType: 'text/plain',
            body: require('stream').Readable.from(buffer)
        };

        const response = await drive.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: 'id, name, size, webViewLink',
            supportsAllDrives: true
        });

        const file = response.data;

        logTest({
            test: 'File Upload',
            status: 'PASS',
            message: 'Successfully uploaded test file',
            details: {
                id: file.id,
                name: file.name,
                size: file.size,
                link: file.webViewLink
            }
        });

        return file.id;
    } catch (error: any) {
        logTest({
            test: 'File Upload (Specified Folder)',
            status: 'FAIL',
            message: error.message,
            details: error
        });

        // Fallback: Try uploading to root
        try {
            console.log('\n⚠️  Attempting upload to root folder (to verify account status)...\n');
            const drive = getDriveClient();
            const testContent = `Root Upload Test\n${new Date().toISOString()}`;
            const buffer = Buffer.from(testContent, 'utf-8');

            const fileMetadata = { name: `root-test-${Date.now()}.txt` };
            const media = {
                mimeType: 'text/plain',
                body: require('stream').Readable.from(buffer)
            };

            const response = await drive.files.create({
                requestBody: fileMetadata,
                media: media,
                fields: 'id, name, webViewLink'
            });

            logTest({
                test: 'File Upload (Root Folder)',
                status: 'PASS',
                message: 'Successfully uploaded to Service Account root',
                details: response.data
            });
            return response.data.id;
        } catch (rootError: any) {
            logTest({
                test: 'File Upload (Root Folder)',
                status: 'FAIL',
                message: rootError.message
            });
            return null;
        }
    }
}

async function testFileList() {
    console.log('\n📄 Testing File Listing...\n');

    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    try {
        const drive = getDriveClient();

        const response = await drive.files.list({
            q: `'${folderId}' in parents and trashed=false`,
            fields: 'files(id, name, size, mimeType, createdTime)',
            pageSize: 10,
            orderBy: 'createdTime desc',
            supportsAllDrives: true,
            includeItemsFromAllDrives: true
        });

        const files = response.data.files || [];

        logTest({
            test: 'File Listing',
            status: 'PASS',
            message: `Found ${files.length} file(s) in folder`,
            details: files.slice(0, 5).map(f => ({
                name: f.name,
                size: f.size,
                mimeType: f.mimeType
            }))
        });

        return true;
    } catch (error: any) {
        logTest({
            test: 'File Listing',
            status: 'FAIL',
            message: error.message,
            details: error
        });
        return false;
    }
}

async function testFileDownload(fileId: string) {
    console.log('\n⬇️  Testing File Download...\n');

    try {
        const drive = getDriveClient();

        const response = await drive.files.get({
            fileId: fileId,
            alt: 'media'
        }, {
            responseType: 'arraybuffer'
        });

        const buffer = Buffer.from(response.data as ArrayBuffer);

        logTest({
            test: 'File Download',
            status: 'PASS',
            message: 'Successfully downloaded file',
            details: {
                size: buffer.length,
                preview: buffer.toString('utf-8').substring(0, 100)
            }
        });

        return true;
    } catch (error: any) {
        logTest({
            test: 'File Download',
            status: 'FAIL',
            message: error.message,
            details: error
        });
        return false;
    }
}

async function testFileDeletion(fileId: string) {
    console.log('\n🗑️  Testing File Deletion...\n');

    try {
        const drive = getDriveClient();

        await drive.files.delete({
            fileId: fileId
        });

        logTest({
            test: 'File Deletion',
            status: 'PASS',
            message: 'Successfully deleted test file'
        });

        return true;
    } catch (error: any) {
        logTest({
            test: 'File Deletion',
            status: 'FAIL',
            message: error.message,
            details: error
        });
        return false;
    }
}

async function main() {
    console.log('🚀 Google Drive Connection Test\n');
    console.log('='.repeat(50));

    let uploadedFileId: string | null = null;

    try {
        // Test 1: Environment Variables
        const envOk = await testEnvironmentVariables();
        if (!envOk) {
            console.error('\n❌ Environment variables test failed. Cannot proceed.\n');
            process.exit(1);
        }

        // Test 2: Authentication
        const authOk = await testAuthentication();
        if (!authOk) {
            console.error('\n❌ Authentication failed. Check your credentials.\n');
            process.exit(1);
        }

        // Test 3: List ALL visible files (to debug permissions)
        console.log('\n🔍 Listing ALL visible files (root)...');
        try {
            const drive = getDriveClient();
            const listRes = await drive.files.list({
                pageSize: 10,
                fields: 'files(id, name, mimeType, owners)',
                supportsAllDrives: true,
                includeItemsFromAllDrives: true
            });
            console.log('Visible files:', JSON.stringify(listRes.data.files, null, 2));
        } catch (e: any) {
            console.error('List all files failed:', e.message);
        }

        // Test 4: Folder Access
        const folderOk = await testFolderAccess();
        if (!folderOk) {
            console.error('\n⚠️  Folder access failed. Will attempt root folder tests...\n');
            // Do not exit, continue to try root upload
        }

        // Test 4: File Upload
        uploadedFileId = await testFileUpload();

        // Test 5: File Listing
        await testFileList();

        // Test 6: File Download (if upload succeeded)
        if (uploadedFileId) {
            await testFileDownload(uploadedFileId);
        }

        // Test 7: File Deletion (cleanup)
        if (uploadedFileId) {
            await testFileDeletion(uploadedFileId);
        }

    } catch (error) {
        console.error('\n\n💥 Unexpected error:', error);
        process.exit(1);
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('\n📊 Test Summary:\n');

    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    const total = results.length;

    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%\n`);

    if (failed === 0) {
        console.log('🎉 All tests passed! Google Drive is configured correctly.\n');
        process.exit(0);
    } else {
        console.log('⚠️  Some tests failed. Please review the errors above.\n');
        process.exit(1);
    }
}

main();
