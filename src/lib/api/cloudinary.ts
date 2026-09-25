// src/features/categories/api/categories.api.ts
export const cloudinaryApi = {

    uploadImage: async (file: File): Promise<{ url: string }> => {
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

        if (!cloudName) {
            throw new Error('Cloudinary cloud name is not configured');
        }

        if (!uploadPreset) {
            throw new Error('Cloudinary upload preset is not configured');
        }

        const form = new FormData();

        form.append('file', file);
        form.append('upload_preset', uploadPreset);
        form.append('folder', 'categories');

        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
            {
                method: 'POST',
                body: form,
            }
        );

        if (!response.ok) {
            const error = await response.json().catch(() => null);

            throw new Error(
                error?.error?.message || 'Failed to upload image to Cloudinary'
            );
        }

        const data = await response.json();

        return {
            url: data.secure_url,
        };
    },

};