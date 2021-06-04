var snackbarQueue = [];
var animationSpeed = 300;

class Snackbar {
    constructor(title, content = '', timeout = 3000, image = null) {
        this.id = generateId();
        this.title = title;
        this.content = content;
        this.timeout = timeout;
        this.image = image;
        this.elem = document.createElement('div');
        this.elem.id = `snackbar-${this.id}`;
        this.elem.classList.add('snackbar', 'fade-in', 'position-relative');
        this.elem.innerHTML = `
        <i class="fa fa-times text-14"></i>
        ${this.title ? `<div class="text-bold text-18 pb-2">${this.title}</div>` : ''}
        <div class="text-12">${this.content}</div>
        `

        this.elem.getElementsByClassName('fa-times')[0].addEventListener('click', () => this.close());
        document.getElementById('snackbar-overlay').appendChild(this.elem);
        setTimeout(() => this.elem.classList.remove('fade-in'), animationSpeed);

        // A negative timeout makes the snackbar displayed infinitely
        if (this.timeout >= 0) {
            this.close(this.timeout);
        }
        
        snackbarQueue.push(this);
    }

    close(timeout = 0) {
        setTimeout(() => this.elem.classList.add('fade-out'), timeout); 
        setTimeout(() => {
            // Checks snackbar existence
            if (document.getElementById(`snackbar-${this.id}`)) {
                document.getElementById('snackbar-overlay').removeChild(this.elem);
                snackbarQueue = snackbarQueue.filter((snackbar) => snackbar.id !== this.id);
            }
        }, timeout + animationSpeed);
    }
}