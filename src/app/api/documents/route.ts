import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { DocumentType } from '@/types/supabase';

// GET /api/documents — list all documents for the current user
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const typeFilter = request.nextUrl.searchParams.get('type') as DocumentType | null;

  let query = supabase
    .from('documents')
    .select('*')
    .order('created_at', { ascending: false });

  if (typeFilter) {
    query = query.eq('type', typeFilter);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/documents — upload a new document
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const type = formData.get('type') as DocumentType | null;
  const pairId = formData.get('pair_id') as string | null;

  if (!file || !type) {
    return NextResponse.json(
      { error: 'File and type are required' },
      { status: 400 }
    );
  }

  // Validate file type
  const { getMimeType, validateFile, parseDocument } = await import('@/lib/documents/parser');
  const mimeType = getMimeType(file.name);

  if (!mimeType) {
    return NextResponse.json(
      { error: 'Unsupported file type. Upload PDF, DOCX, or TXT.' },
      { status: 400 }
    );
  }

  const validationError = validateFile(file.name, file.size);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  // Read file buffer
  const buffer = Buffer.from(await file.arrayBuffer());

  // Parse document text
  let contentParsed: string;
  try {
    contentParsed = await parseDocument(buffer, mimeType);
  } catch {
    return NextResponse.json(
      { error: 'Failed to parse document. Please ensure the file is not corrupted.' },
      { status: 422 }
    );
  }

  // Upload to Supabase Storage
  const storagePath = `${user.id}/${crypto.randomUUID()}-${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(storagePath, buffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json(
      { error: `Storage upload failed: ${uploadError.message}` },
      { status: 500 }
    );
  }

  // Insert document record
  const { data, error: insertError } = await supabase
    .from('documents')
    .insert({
      user_id: user.id,
      type,
      file_name: file.name,
      mime_type: mimeType,
      storage_path: storagePath,
      content_parsed: contentParsed,
      pair_id: pairId,
    })
    .select()
    .single();

  if (insertError) {
    // Clean up uploaded file on DB insert failure
    await supabase.storage.from('documents').remove([storagePath]);
    return NextResponse.json(
      { error: `Failed to save document: ${insertError.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json(data, { status: 201 });
}
