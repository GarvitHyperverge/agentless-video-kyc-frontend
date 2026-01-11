export interface PanImage {
  file: File | null;
  url: string | null; // Object URL for display
}

export interface PanImages {
  front: PanImage;
  back: PanImage;
}
