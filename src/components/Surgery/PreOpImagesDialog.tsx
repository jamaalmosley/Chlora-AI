import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Upload, Trash2, Image as ImageIcon, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

interface PreOpImage {
  id: string;
  file_path: string;
  file_name: string;
  description: string | null;
  created_at: string;
}

interface PreOpImagesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  surgeryId: string;
  surgeryName: string;
}

export function PreOpImagesDialog({ open, onOpenChange, surgeryId, surgeryName }: PreOpImagesDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<PreOpImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [description, setDescription] = useState("");
  const [selectedImage, setSelectedImage] = useState<PreOpImage | null>(null);

  useEffect(() => {
    if (open && surgeryId) {
      fetchImages();
    }
  }, [open, surgeryId]);

  const fetchImages = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('preop_images')
        .select('*')
        .eq('surgery_id', surgeryId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setImages(data || []);
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Image must be less than 10MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${surgeryId}/${Date.now()}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('preop-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Create database record
      const { data, error: dbError } = await supabase
        .from('preop_images')
        .insert({
          surgery_id: surgeryId,
          file_path: fileName,
          file_name: file.name,
          description: description || null,
          uploaded_by: user.id,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setImages([data, ...images]);
      setDescription("");

      toast({
        title: "Image Uploaded",
        description: "Pre-op image has been saved.",
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const deleteImage = async (image: PreOpImage) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('preop-images')
        .remove([image.file_path]);

      if (storageError) console.warn('Storage delete error:', storageError);

      // Delete from database
      const { error: dbError } = await supabase
        .from('preop_images')
        .delete()
        .eq('id', image.id);

      if (dbError) throw dbError;

      setImages(images.filter(img => img.id !== image.id));
      if (selectedImage?.id === image.id) {
        setSelectedImage(null);
      }

      toast({
        title: "Image Deleted",
        description: "Pre-op image has been removed.",
      });
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete image.",
        variant: "destructive",
      });
    }
  };

  const getImageUrl = (filePath: string) => {
    const { data } = supabase.storage
      .from('preop-images')
      .getPublicUrl(filePath);
    return data.publicUrl;
  };

  const getSignedUrl = async (filePath: string) => {
    const { data, error } = await supabase.storage
      .from('preop-images')
      .createSignedUrl(filePath, 3600); // 1 hour expiry
    
    if (error || !data?.signedUrl) return null;
    return data.signedUrl;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pre-Op Images - {surgeryName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Upload section */}
          <div className="border-2 border-dashed rounded-lg p-6">
            <div className="flex flex-col items-center gap-4">
              <Camera className="h-10 w-10 text-muted-foreground" />
              <div className="text-center">
                <p className="font-medium">Upload Pre-Op Images</p>
                <p className="text-sm text-muted-foreground">
                  Capture or upload patient images before surgery
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
                <Input
                  placeholder="Image description (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    "Uploading..."
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload
                    </>
                  )}
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>

          {/* Images grid */}
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">Loading images...</div>
          ) : images.length === 0 ? (
            <div className="py-8 text-center">
              <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No pre-op images uploaded yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="relative group aspect-square rounded-lg overflow-hidden border bg-muted cursor-pointer"
                  onClick={() => setSelectedImage(image)}
                >
                  <ImageWithSignedUrl filePath={image.file_path} alt={image.description || image.file_name} />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteImage(image);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {image.description && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2 truncate">
                      {image.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Lightbox */}
          {selectedImage && (
            <div
              className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedImage(null)}
            >
              <Button
                size="icon"
                variant="ghost"
                className="absolute top-4 right-4 text-white hover:bg-white/20"
                onClick={() => setSelectedImage(null)}
              >
                <X className="h-6 w-6" />
              </Button>
              <div className="max-w-full max-h-full" onClick={(e) => e.stopPropagation()}>
                <ImageWithSignedUrl 
                  filePath={selectedImage.file_path} 
                  alt={selectedImage.description || selectedImage.file_name}
                  className="max-w-full max-h-[80vh] object-contain"
                />
                {selectedImage.description && (
                  <p className="text-white text-center mt-4">{selectedImage.description}</p>
                )}
                <p className="text-white/60 text-center text-sm mt-2">
                  Uploaded {new Date(selectedImage.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper component to load signed URLs
function ImageWithSignedUrl({ filePath, alt, className }: { filePath: string; alt: string; className?: string }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadUrl = async () => {
      const { data, error } = await supabase.storage
        .from('preop-images')
        .createSignedUrl(filePath, 3600);
      
      if (data?.signedUrl) {
        setUrl(data.signedUrl);
      }
    };
    loadUrl();
  }, [filePath]);

  if (!url) {
    return <div className={`bg-muted animate-pulse ${className || 'w-full h-full'}`} />;
  }

  return (
    <img
      src={url}
      alt={alt}
      className={className || "w-full h-full object-cover"}
    />
  );
}
