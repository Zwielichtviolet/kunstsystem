/* Web Share API с безопасным fallback на копирование ссылки. */
window.shareCurrentPage = function shareCurrentPage() {
    var payload = { title: document.title, text: 'Kunstsystem — Рупор искусства', url: location.href };
    if (navigator.share) {
        navigator.share(payload).catch(function () {});
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(location.href).then(function () {
            var button = document.getElementById('share-article');
            if (button) button.textContent = '✓ Ссылка скопирована';
        }).catch(function () { window.prompt('Скопируйте ссылку:', location.href); });
    } else window.prompt('Скопируйте ссылку:', location.href);
};
