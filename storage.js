/* Локальное хранилище Kunstsystem. Ошибки приватного режима не ломают приложение. */
window.KSStorage = {
    get: function (key) {
        try { return localStorage.getItem(key); } catch (e) { return null; }
    },
    set: function (key, value) {
        try { localStorage.setItem(key, value); } catch (e) { /* storage недоступно */ }
    }
};
