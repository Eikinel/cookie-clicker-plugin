const UI_FEEDBACK_ELEMENT = {
    SNACKBAR: 'snackbar',
    DIALOG: 'dialog',
}

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
        this.elem.classList.add(this.type, 'fade-in', 'position-relative', 'framed');
        
        if (!UIFeedbacksQueue[type]) {
            UIFeedbacksQueue[type] = [];
        }

        UIFeedbacksQueue[type].push(this);
    }

    close(timeout = 0) {
        setTimeout(() => this.elem.classList.add('fade-out'), timeout); 
        setTimeout(() => {
            // Checks UI element existence in DOM
            if (document.getElementById(`${this.type}-${this.id}`)) {
                switch (this.type) {
                    case UI_FEEDBACK_ELEMENT.SNACKBAR:
                        document.getElementById('snackbar-overlay').removeChild(this.elem);
                        break;
                     case UI_FEEDBACK_ELEMENT.DIALOG: 
                        document.getElementById('dialog-container').remove();
                        break;
                }
                UIFeedbacksQueue[this.type] = UIFeedbacksQueue[this.type].filter((UIFeedback) => UIFeedback.id !== this.id);
            }
        }, timeout + this.animationSpeed);
    }
}

class Snackbar extends UIFeedback {
    constructor(title, content = '', timeout = 3000) {
        super(UI_FEEDBACK_ELEMENT.SNACKBAR, title, content);
        
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
        super(UI_FEEDBACK_ELEMENT.DIALOG, title, content);

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
        <div class="dialog-content pb-2">${this.content}</div>
        <div class="dialog-footer"></div>
        `
        
        this.buttonListeners = [];
        buttons.forEach((button) => {
            const buttonElem = document.createElement('a');

            this.buttonListeners.push(
                new Promise((resolve) => buttonElem.addEventListener('click', () => {
                    this.close();
                    resolve(button.validate);
                }))
            );
            buttonElem.classList.add('option', ...(button.classList || []));
            buttonElem.innerHTML = button.label;
            this.elem.getElementsByClassName('dialog-footer')[0].insertAdjacentElement('beforeend', buttonElem);
        });

        this.elem.getElementsByClassName('fa-times')[0].addEventListener('click', () => this.close());
        parent.appendChild(this.elem);
        setTimeout(() => this.elem.classList.remove('fade-in'), this.animationSpeed);
    }

    async onClose(callback) {
        return new Promise((resolve) => Promise.any(this.buttonListeners).then((value) => resolve(callback(value))));
    }
}