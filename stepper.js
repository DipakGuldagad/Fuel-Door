/**
 * Fuel@Door Progress Stepper Controller
 */

class Stepper {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.steps = Array.from(this.container.querySelectorAll('.step'));
        this.progressFill = this.container.querySelector('.stepper-progress-fill');
        this.currentStep = 1;
        this.totalSteps = this.steps.length;

        this.init();
    }

    init() {
        // Add click listeners to steps for interactivity (optional, based on requirement)
        this.steps.forEach((step, index) => {
            step.addEventListener('click', () => {
                this.goToStep(index + 1);
            });
        });

        // Initialize first step
        this.updateUI();
    }

    /**
     * Moves the stepper to a specific step
     * @param {number} stepNumber - 1-indexed step number
     */
    goToStep(stepNumber) {
        if (stepNumber < 1 || stepNumber > this.totalSteps) return;

        this.currentStep = stepNumber;
        this.updateUI();
    }

    updateUI() {
        this.steps.forEach((step, index) => {
            const stepNum = index + 1;

            // Remove all state classes
            step.classList.remove('active', 'completed', 'pending');

            if (stepNum < this.currentStep) {
                step.classList.add('completed');
            } else if (stepNum === this.currentStep) {
                step.classList.add('active');
            } else {
                step.classList.add('pending');
            }
        });

        // Update progress line length
        // Progress is calculated between center of first step and last step.
        // Actually, easier to use (currentStep - 1) / (totalSteps - 1) * 100
        const percentage = ((this.currentStep - 1) / (this.totalSteps - 1)) * 100;
        this.progressFill.style.width = `${percentage}%`;
    }

    next() {
        if (this.currentStep < this.totalSteps) {
            this.goToStep(this.currentStep + 1);
        }
    }

    prev() {
        if (this.currentStep > 1) {
            this.goToStep(this.currentStep - 1);
        }
    }
}

// Global helper for easy access as requested
window.goToStep = (stepNumber) => {
    if (window.fuelStepper) {
        window.fuelStepper.goToStep(stepNumber);
    }
};

// Initialize when DOM is ready if the container exists
document.addEventListener('DOMContentLoaded', () => {
    const stepperElement = document.getElementById('fuel-stepper-container');
    if (stepperElement) {
        window.fuelStepper = new Stepper('fuel-stepper-container');
    }
});
