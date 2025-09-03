# Hero Video Asset Specifications

## 🎬 Video Requirements

### **File Formats & Compression**
- **Primary**: WebM (VP9 codec) for Chrome/Firefox/Edge
- **Fallback**: MP4 (H.264 codec) for Safari/iOS
- **Max File Size**: 2MB total (1.5MB WebM + 0.5MB MP4)
- **Duration**: 4 seconds maximum
- **No Audio**: Muted for autoplay compliance

### **Resolution & Quality**
- **Desktop**: 800x600px (4:3 aspect ratio)
- **Mobile**: 600x450px (optimized for smaller screens)
- **Bitrate Target**: 
  - WebM: ~3000 kbps
  - MP4: ~2500 kbps
- **Frame Rate**: 30fps (smooth but efficient)

### **Content Specifications**
- **Frame 1 (0s)**: Covered state - portrait with elegant drape/cover
- **Frames 2-119 (0.1s-3.9s)**: Smooth reveal transition
- **Frame 120 (4s)**: Final revealed state - pet mom as Mona Lisa with pet

## 📸 Image Assets Required

### **Poster Image** (`hero-covered.jpg`)
- **Purpose**: Instant load, identical to video frame 1
- **Format**: JPEG, optimized for web
- **Size**: <100KB
- **Resolution**: 800x600px
- **Content**: Covered portrait state

### **Fallback Image** (`hero-revealed.jpg`)
- **Purpose**: Final state if video fails
- **Format**: JPEG, optimized for web  
- **Size**: <150KB
- **Resolution**: 800x600px
- **Content**: Final revealed Mona Lisa transformation

## 🛠️ Compression Settings

### **WebM (VP9)**
```bash
ffmpeg -i input.mov \
  -c:v libvpx-vp9 -crf 30 -b:v 3000k \
  -c:a libopus -b:a 128k \
  -f webm hero-reveal.webm
```

### **MP4 (H.264)**
```bash
ffmpeg -i input.mov \
  -c:v libx264 -crf 23 -preset medium \
  -profile:v baseline -level 3.0 \
  -movflags +faststart \
  -f mp4 hero-reveal.mp4
```

## 📱 Mobile Optimizations

### **Responsive Breakpoints**
- **Mobile**: 320px-768px (single column)
- **Tablet**: 768px-1024px (centered)
- **Desktop**: 1024px+ (max-width container)

### **Touch Considerations**
- Video area not clickable (prevents accidental pause)
- CTA button positioned below video with adequate spacing
- Minimum 44px touch targets

## ⚡ Performance Targets

### **Loading Metrics**
- **LCP**: Poster image visible in <1s
- **Video Start**: Playback begins in <2s
- **Fallback**: Final image loads in <1.5s if video fails

### **Network Considerations**
- **3G**: Graceful degradation to final image
- **Slow Connection**: Poster → final image (skip video)
- **No JS**: Static final image always visible

## 🎯 Success Criteria

### **User Experience**
- ✅ Instant visual content (no blank state)
- ✅ Smooth 4s reveal animation
- ✅ Final state always shows revealed product
- ✅ Works on 95%+ of devices/browsers

### **Technical Requirements**
- ✅ Autoplay without user interaction
- ✅ Muted for browser compliance
- ✅ No loop (plays once, stays on final frame)
- ✅ Graceful fallback on any failure

## 📁 File Structure
```
/public/
  /images/
    hero-covered.jpg     (poster, <100KB)
    hero-revealed.jpg    (fallback, <150KB)
  /videos/
    hero-reveal.webm     (primary, <1.5MB)
    hero-reveal.mp4      (fallback, <0.5MB)
```

## 🎨 Creative Direction

### **Reveal Concept**
- **Start**: Elegant drape/curtain covering the portrait
- **Transition**: Smooth unveiling motion (top-to-bottom or center-out)
- **End**: Full Mona Lisa transformation with pet visible
- **Style**: Cinematic, premium, magical feeling

### **Visual Consistency**
- Match existing brand colors (Mona Lisa Gold accents)
- Consistent lighting and composition
- Professional photography quality
- Renaissance art aesthetic maintained
