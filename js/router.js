export const Router = {
    routes: {},
    register(name, fn) { this.routes[name] = fn; },
    navigate(name, param) {
        const app = document.getElementById('main-view');
        if(this.routes[name]) {
            app.innerHTML = this.routes[name](param);
            window.dispatchEvent(new CustomEvent('routeChanged', { detail: { name, param } }));
        }
    }
};