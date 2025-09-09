// Procedural sprite rendering replacing texture atlas usage.
// This stub draws simple shapes for game entities.

function drawSprite(ctx, name, x, y, w, h) {
  // Provide default dimensions if not specified
  w = w ?? 16;
  h = h ?? 16;
  ctx.save();
  switch (name) {
    case 'farmer':
      ctx.fillStyle = '#f8d98c';
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);
      break;
    case 'sprout':
      ctx.fillStyle = '#3b873e';
      ctx.fillRect(x, y, w, h);
      break;
    case 'plantCandy':
      ctx.fillStyle = '#ff5ea8';
      ctx.fillRect(x, y, w, h);
      break;
    case 'plantCarrot':
      ctx.fillStyle = '#e67e22';
      ctx.fillRect(x, y, w, h);
      break;
    default:
      ctx.restore();
      return false; // allow callers to handle unknown sprites
  }
  ctx.restore();
  return true;
}

