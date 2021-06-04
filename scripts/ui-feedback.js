var UIFeedbacksQueue = {};

class UIFeedback {
    constructor(type, title, content) {
        this.type = type;
        this.title = title;
        this.content = content;
        this.id = generateId();
        this.animationSpeed = 300;
        this.elem = document.createElement('div');
        this.elem.id = `${this.type}-${this.id}`;
        this.elem.classList.add(this.type, 'fade-in', 'position-relative');
        
        if (!UIFeedbacksQueue[type]) {
            UIFeedbacksQueue[type] = [];
        }

        UIFeedbacksQueue[type].push(this);
    }

    close(timeout = 0) {
        setTimeout(() => this.elem.classList.add('fade-out'), timeout); 
        setTimeout(() => {
            // Checks snackbar existence
            if (document.getElementById(`${this.type}-${this.id}`)) {
                switch (this.type) {
                    case 'snackbar':
                        document.getElementById('snackbar-overlay').removeChild(this.elem);
                        break;
                     case 'dialog': 
                        document.getElementById('dialog-container').remove();
                        break;
                }
                snackbarQueue = snackbarQueue.filter((snackbar) => snackbar.id !== this.id);
            }
        }, timeout + this.animationSpeed);
    }
}

class Snackbar extends UIFeedback {
    constructor(title, content = '', timeout = 3000) {
        super('snackbar', title, content);
        
        this.timeout = timeout;
        this.elem.innerHTML = `
        <i class="fa fa-times text-14"></i>
        ${this.title ? `<div class="text-bold text-18 pb-2">${this.title}</div>` : ''}
        <div class="text-12">${this.content}</div>
        `

        this.elem.getElementsByClassName('fa-times')[0].addEventListener('click', () => this.close());
        document.getElementById('snackbar-overlay').appendChild(this.elem);
        setTimeout(() => this.elem.classList.remove('fade-in'), this.animationSpeed);

        // A negative timeout makes the snackbar displayed infinitely
        if (this.timeout >= 0) {
            this.close(this.timeout);
        }
    }
}

class Dialog extends UIFeedback {
    constructor(title, content, buttons = [], options = { hasBackdrop: true }) {
        super('dialog', title, content);

        // Parent container setup
        const parent = document.createElement('div');

        parent.id = 'dialog-container';
        parent.classList.add(
            options.hasBackdrop ? 'backdrop' : '',
            'd-flex',
            'fill',
            'text-white',
            'align-items-center',
            'justify-content-center',
            'position-absolute',
            'backdrop',
            'h-100',
        );
        document.body.appendChild(parent);

        // Dialog element setup
        this.elem.innerHTML = `
        ${this.title ? `
        <div class="text-bold text-18 pb-2">${this.title}</div>` : ''}
        <i class="fa fa-times text-14"></i>
        <div class="dialog-content">${this.content}</div>
        ${buttons.forEach((button) => {
            button.addEventListener('click', () => button.callback);
            return <a class="option">${button.name}</a>
        })}
        `

        this.elem.getElementsByClassName('fa-times')[0].addEventListener('click', () => this.close());
        parent.appendChild(this.elem);
        setTimeout(() => this.elem.classList.remove('fade-in'), this.animationSpeed);
    }
}