// Configuration EmailJS
const EMAILJS_USER_ID = '6B5JqP46P3i081Lxv'; // À remplacer par votre ID EmailJS
const EMAILJS_TEMPLATE_ID = 'template_kxnhznc'; // À remplacer par votre ID de template
const EMAILJS_SERVICE_ID = 'service_4dg1ygs'; // À remplacer par votre ID de service

// Fonction de validation
function validateForm(formData) {
    const errors = [];
    const requiredFields = ['nom', 'prenom', 'email', 'telephone', 'voiture', 'date'];
    
    requiredFields.forEach(field => {
        if (!formData.get(field)?.trim()) {
            errors.push(`Le champ ${field} est obligatoire`);
        }
    });

    // Validation email
    const email = formData.get('email');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push("L'adresse email n'est pas valide");
    }

    // Validation téléphone
    const phone = formData.get('telephone');
    if (phone && !/^\+?[0-9]{10,15}$/.test(phone)) {
        errors.push("Le numéro de téléphone n'est pas valide");
    }

    // Validation passagers
    const passagers = parseInt(formData.get('passagers'));
    if (passagers < 1 || passagers > 7) {
        errors.push("Le nombre de passagers doit être entre 1 et 7");
    }

    return errors;
}

// Fonction d'envoi de réservation
async function submitReservation(formData) {
    try {
        // Validation
        const errors = validateForm(formData);
        if (errors.length > 0) {
            throw new Error(errors.join('\n'));
        }

        // Préparation des données pour EmailJS
        const templateParams = {
            from_name: `${formData.get('prenom')} ${formData.get('nom')}`,
            from_email: formData.get('email'),
            to_name: 'TamtamVoyages',
            message: `
                Nouvelle réservation :
                Nom: ${formData.get('nom')}
                Prénom: ${formData.get('prenom')}
                Email: ${formData.get('email')}
                Téléphone: ${formData.get('telephone')}
                Voiture: ${formData.get('voiture')}
                Date: ${formData.get('date')}
                Passagers: ${formData.get('passagers')}
                Bagage: ${formData.get('bagage') ? 'Oui (+20€)' : 'Non'}
                Enfant: ${formData.get('enfant') ? 'Oui (+25€)' : 'Non'}
                Total: ${formData.get('total')}
            `,
            reply_to: formData.get('email')
        };

        // Envoi de l'email via EmailJS
        const response = await emailjs.send(
            EMAILJS_SERVICE_ID,
            EMAILJS_TEMPLATE_ID,
            templateParams,
            EMAILJS_USER_ID
        );

        if (response.status === 200) {
            return {
                success: true,
                message: 'Votre réservation a été enregistrée avec succès. Vous recevrez un email de confirmation sous peu.'
            };
        } else {
            throw new Error('Erreur lors de l\'envoi de la réservation');
        }
    } catch (error) {
        console.error('Erreur:', error);
        throw error;
    }
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    // Chargement du script EmailJS
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
    script.onload = function() {
        emailjs.init(EMAILJS_USER_ID);
    };
    document.head.appendChild(script);

    // Gestion du formulaire de réservation
    const form = document.getElementById('reservationForm');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            try {
                const formData = new FormData(form);
                const result = await submitReservation(formData);
                
                // Affichage du message de succès
                const confirmation = document.createElement('div');
                confirmation.className = 'fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded shadow-lg';
                confirmation.textContent = result.message;
                document.body.appendChild(confirmation);
                
                // Réinitialisation du formulaire et redirection
                form.reset();
                setTimeout(() => {
                    confirmation.remove();
                    window.location.href = 'index.html';
                }, 3000);
            } catch (error) {
                // Affichage de l'erreur
                const errorDiv = document.createElement('div');
                errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded shadow-lg';
                errorDiv.textContent = error.message;
                document.body.appendChild(errorDiv);
                setTimeout(() => errorDiv.remove(), 5000);
            }
        });
    }
}); 