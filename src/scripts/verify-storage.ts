
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables immediately
// We use path.resolve to ensure we find .env.local in the project root
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function verifyStorage() {
    console.log("Starting Storage Verification...");

    // Dynamic import to ensure env vars are loaded first
    const { uploadFile, deleteFile } = await import('../services/supabaseStorageService');
    const { supabase } = await import('../lib/supabase');

    // Check connection first
    try {
        const { data, error } = await supabase.storage.listBuckets();
        if (error) {
            console.error("Failed to list buckets. Check your Supabase credentials.");
            console.error(error);
            process.exit(1);
        } else {
            console.log("Supabase Connection OK. Available Buckets:", data.map(b => b.name));

            // Check if 'uploads' bucket exists
            if (!data.find(b => b.name === 'uploads')) {
                console.warn("⚠️  Bucket 'uploads' not found! Attempting to create it...");
                const { error: createError } = await supabase.storage.createBucket('uploads', {
                    public: true
                });
                if (createError) {
                    console.error("Failed to create bucket 'uploads'. Please create it manually in the dashboard.");
                    throw createError;
                }
                console.log("✅ Bucket 'uploads' created successfully.");
            }
        }
    } catch (err) {
        console.error("Init check failed:", err);
        process.exit(1);
    }

    // Now proceed with upload/delete test

    // Create a dummy file buffer
    const content = "Hello, this is a test file for PlanOS Supabase Storage Integration.";
    const buffer = Buffer.from(content, 'utf-8');
    const filename = `test_upload_${Date.now()}.txt`;
    const mimeType = 'text/plain';

    try {
        console.log(`\n1. Attempting to upload file: ${filename}`);
        const uploadedFile = await uploadFile({
            buffer,
            filename,
            mimeType
        });

        console.log("   ✅ Upload successful!");
        console.log(`   File ID (Path): ${uploadedFile.id}`);
        console.log(`   Public Link: ${uploadedFile.webViewLink}`);

        console.log(`\n2. Attempting to delete file: ${uploadedFile.id}`);
        await deleteFile(uploadedFile.id);
        console.log("   ✅ Delete successful!");

        console.log("\n🎉 Verification Completed Successfully!");

    } catch (error) {
        console.error("\n❌ Verification Failed!");
        console.error(error);
        process.exit(1);
    }
}

verifyStorage();
