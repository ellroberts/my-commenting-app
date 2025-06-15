// src/utils/positionUtils.js

// Advanced positioning that tries to account for iframe scaling
export const positionUtils = {
  // Convert pixel coordinates to percentages
  pixelsToPercent: (x, y, containerWidth, containerHeight) => ({
    x: (x / containerWidth) * 100,
    y: (y / containerHeight) * 100
  }),
  
  // Convert percentages back to pixel coordinates
  percentToPixels: (xPercent, yPercent, containerWidth, containerHeight) => ({
    x: (xPercent / 100) * containerWidth,
    y: (yPercent / 100) * containerHeight
  }),

  // Scale-aware positioning - try to detect iframe content scaling
  getIframeScale: (containerWidth, containerHeight) => {
    // Common design breakpoints - adjust these based on your prototype
    const designBreakpoints = [
      { width: 1920, height: 1080, scale: 1.0 },
      { width: 1440, height: 900, scale: 0.9 },
      { width: 1024, height: 768, scale: 0.8 },
      { width: 768, height: 1024, scale: 0.7 }, // tablet
      { width: 375, height: 667, scale: 0.5 }   // mobile
    ];

    // Find the closest breakpoint
    let closestBreakpoint = designBreakpoints[0];
    let minDifference = Math.abs(containerWidth - closestBreakpoint.width);

    for (const breakpoint of designBreakpoints) {
      const difference = Math.abs(containerWidth - breakpoint.width);
      if (difference < minDifference) {
        minDifference = difference;
        closestBreakpoint = breakpoint;
      }
    }

    return closestBreakpoint.scale;
  },

  // Scale-aware conversion
  pixelsToScaledPercent: (x, y, containerWidth, containerHeight) => {
    const scale = positionUtils.getIframeScale(containerWidth, containerHeight);
    const scaledX = x / scale;
    const scaledY = y / scale;
    
    return {
      x: (scaledX / containerWidth) * 100,
      y: (scaledY / containerHeight) * 100
    };
  },

  scaledPercentToPixels: (xPercent, yPercent, containerWidth, containerHeight) => {
    const scale = positionUtils.getIframeScale(containerWidth, containerHeight);
    const baseX = (xPercent / 100) * containerWidth;
    const baseY = (yPercent / 100) * containerHeight;
    
    return {
      x: baseX * scale,
      y: baseY * scale
    };
  }
};