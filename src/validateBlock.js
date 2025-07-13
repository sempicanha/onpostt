function validateBlock(block) {
  if (block.mode === "delete") {
    return (
      typeof block.id === "string" &&
      typeof block.pubkey === "string" &&
      typeof block.created_at === "number" &&
      typeof block.mode === "string" &&
      typeof block.sig === "string"
    );
  }else if(block.mode === 'message'){
    return (
        typeof block.id === "string" &&
        typeof block.pubkey === "string" &&
        typeof block.created_at === "number" &&
        typeof block.mode === "string" &&
        (typeof block.content === "string" || typeof block.content === "object") &&
        typeof block.sig === "string" &&
        typeof block.app === "string"
    );
  } else {
    return (
      typeof block.id === "string" &&
      typeof block.pubkey === "string" &&
      typeof block.created_at === "number" &&
      typeof block.mode === "string" &&
      (typeof block.content === "string" || typeof block.content === "object") &&
      typeof block.sig === "string" &&
      typeof block.app === "string"
    );
  }
}

module.exports = {validateBlock};