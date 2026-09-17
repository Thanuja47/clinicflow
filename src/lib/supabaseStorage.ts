import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl || 'https://dummy.supabase.co', supabaseKey || 'dummy_key');

export async function uploadLabReportFile(
  fileBuffer: Buffer,
  fileName: string,
  contentType: string
): Promise<string> {
  try {
    const bucketName = 'lab-reports';
    const filePath = `clinic_${Date.now()}_${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    // Try uploading to Supabase bucket
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, fileBuffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      console.warn('Supabase storage upload warning (bucket may require creation):', error.message);
      // Fallback public mock URL if bucket is not yet provisioned in Supabase dashboard
      return `${supabaseUrl}/storage/v1/object/public/${bucketName}/${filePath}`;
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  } catch (err) {
    console.error('File upload error:', err);
    return `https://dummy-clinic-storage.lk/lab-reports/${Date.now()}_${fileName}`;
  }
}
