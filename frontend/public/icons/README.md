# PWA Icons

This directory should contain the following icon files for the Progressive Web App:

## Required Icons

| File | Size | Purpose |
|------|------|---------|
| `icon-72x72.png` | 72x72 | Android home screen |
| `icon-96x96.png` | 96x96 | Android home screen |
| `icon-128x128.png` | 128x128 | Chrome Web Store |
| `icon-144x144.png` | 144x144 | Windows 8/10 tiles |
| `icon-152x152.png` | 152x152 | iPad |
| `icon-192x192.png` | 192x192 | Android (recommended) |
| `icon-384x384.png` | 384x384 | Android splash |
| `icon-512x512.png` | 512x512 | Android splash, PWA install |

## Optional Maskable Icons

For a better Android experience, add maskable icons:

| File | Size | Purpose |
|------|------|---------|
| `icon-maskable-192x192.png` | 192x192 | Android adaptive icon |
| `icon-maskable-512x512.png` | 512x512 | Android adaptive icon |

## Apple Touch Icons

| File | Size | Purpose |
|------|------|---------|
| `apple-touch-icon-180x180.png` | 180x180 | iOS home screen |
| `apple-touch-icon-152x152.png` | 152x152 | iPad |
| `apple-touch-icon-120x120.png` | 120x120 | iPhone |

## Design Guidelines

### Brand Colors
- **Primary Gold**: #D4AF37
- **Background**: #1a1a2e (dark mode) or #FFFFFF (light mode)
- **Icon Background**: Use #D4AF37 for consistency

### Icon Design Tips
1. Use a simple, recognizable design
2. Ensure good contrast
3. Keep important content in the "safe zone" (center 80%)
4. For maskable icons, allow extra padding (40% on each side)

### Recommended Tool
Use [RealFaviconGenerator](https://realfavicongenerator.net/) to generate all icons from a single high-resolution source image (1024x1024 recommended).

## Quick Generation Script

If you have ImageMagick installed, you can generate icons from a source:

```bash
# Generate from a 1024x1024 source image
for size in 72 96 128 144 152 192 384 512; do
  convert source.png -resize ${size}x${size} icon-${size}x${size}.png
done

# Apple touch icons
for size in 120 152 180; do
  convert source.png -resize ${size}x${size} apple-touch-icon-${size}x${size}.png
done
```

## Favicon

Also needed in the public folder root:
- `favicon.ico` - 16x16, 32x32, 48x48 (multi-size ICO file)
- `favicon-16x16.png` - 16x16
- `favicon-32x32.png` - 32x32
