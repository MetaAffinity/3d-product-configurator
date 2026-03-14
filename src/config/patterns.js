// ============================================================
// TEXTURE PATTERNS per model per part
// ============================================================
//
// HOW TO ADD PATTERNS FOR A NEW MODEL:
//
// 1. Create a folder: public/[ModelName]/patterns/
//    e.g. public/Sneaker/patterns/
//
// 2. Drop your PNG/JPG design images in that folder.
//    Recommended size: 1024x1024 or 2048x2048, square format.
//    e.g. public/Sneaker/patterns/camo.png
//         public/Sneaker/patterns/carbon.png
//
// 3. Add an entry below — model name must match exactly what
//    is used in models.js (case-sensitive), part name must
//    match the color key for that part.
//
//    Sneaker: {
//      front: [
//        { src: "/Sneaker/patterns/camo.png", thumb: "/Sneaker/patterns/camo_thumb.png" },
//        { src: "/Sneaker/patterns/carbon.png" }, // thumb is optional, falls back to src
//      ],
//    },
//
// 4. In the model's component (e.g. Sneaker.js), add:
//    - import { modelPatterns } from "../config/patterns";
//    - const frontPatterns = modelPatterns.Sneaker?.front || [];
//    - useTexture(frontPatterns) to preload
//    - useEffect to apply selected texture to mats.front
//    - useSnapshot(props.textures) to watch for changes
//    (Follow PoloShirt.js as reference)
//
// 5. That's it — the ColorPicker UI picks up patterns
//    automatically and shows thumbnails when that part is selected.
//
// NOTE: Parts with no entry here just show color swatches (normal behavior).
// ============================================================

export const modelPatterns = {
  PoloShirt: {
    // src: full UV texture applied on model
    // thumb: small preview image shown in panel (optional — falls back to src)
    body: [
      { src: "/poloshirt/patterns/design1.png", thumb: "/poloshirt/patterns/design1thumb.jpg" },
      { src: "/poloshirt/patterns/design2.png", thumb: "/poloshirt/patterns/design2thumb.jpg" },
      { src: "/poloshirt/patterns/design3.png" },
    ],
  },
};
