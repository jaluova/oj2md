class ToastUtil {
  static show(message, type = 'success', duration = 2000) {
    const existing = document.querySelector('.oj2md-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `oj2md-toast oj2md-toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add('oj2md-toast-visible');
    });

    setTimeout(() => {
      toast.classList.remove('oj2md-toast-visible');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
}
