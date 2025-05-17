// Fonctions de calcul et gestion des événements
function calculateTotal() {
    // Récupération sécurisée des éléments avec vérification de leur existence
    const reservationForm = document.getElementById('reservationForm');
    const passengerInput = document.getElementById('passengerCount');
    const luggageCheckbox = document.getElementById('extraLuggage');
    const childCheckbox = document.getElementById('childOption');
    const totalDisplay = document.getElementById('estimatedTotal');

    // Vérification que tous les éléments nécessaires existent
    if (!reservationForm || !passengerInput || !luggageCheckbox || !childCheckbox || !totalDisplay) {
        console.error('Un ou plusieurs éléments requis pour le calcul sont manquants');
        return;
    }

    // Récupération et validation du prix de la voiture
    const carPriceStr = reservationForm.getAttribute('data-price');
    const carPrice = parseInt(carPriceStr, 10) || 0;

    // Récupération et validation du nombre de passagers
    let passengers = parseInt(passengerInput.value, 10) || 1;
    
    // Validation du nombre de passagers (max 7)
    if (passengers > 7) {
        passengers = 7;
        passengerInput.value = '7';
        
        // Notification pour l'utilisateur
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded shadow-lg z-50';
        notification.textContent = 'Le nombre de passagers ne peut pas dépasser 7.';
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }

    // Récupération des options avec vérification de leur état
    const luggage = luggageCheckbox.checked ? 20 : 0;
    const child = childCheckbox.checked ? 25 : 0;
    
    // Calcul du total avec arrondi pour éviter les problèmes de précision
    const total = Math.round((carPrice * passengers) + luggage + child);
    
    // Mise à jour de l'affichage avec formatage
    totalDisplay.textContent = `${total.toLocaleString('fr-FR')} €`;

    // Mise à jour du champ caché pour le formulaire
    const inputTotalEstimate = document.getElementById('inputTotalEstimate');
    if (inputTotalEstimate) {
        inputTotalEstimate.value = total.toString();
    }
}

// Gestionnaires d'événements améliorés pour la compatibilité cross-browser
function addEventListeners() {
    const elements = ['passengerCount', 'extraLuggage', 'childOption'];
    
    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            // Utilisation de addEventListener pour une meilleure compatibilité
            if (element.type === 'number' || element.type === 'text') {
                element.addEventListener('input', calculateTotal);
                element.addEventListener('change', calculateTotal);
            } else if (element.type === 'checkbox') {
                element.addEventListener('change', calculateTotal);
            }
        }
    });
}

// Event Listeners
['passengerCount', 'extraLuggage', 'childOption'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', calculateTotal);
    document.getElementById(id)?.addEventListener('change', calculateTotal);
});

function showReservationForm(button) {
    try {
        if (!button) {
            throw new Error('Le bouton de réservation est manquant');
        }

        const carName = button.getAttribute('data-car');
        const carPrice = parseInt(button.getAttribute('data-price'), 10);
        const searchDate = document.getElementById('searchDate');
        const departureCity = document.getElementById('departureCity');
        const destinationCity = document.getElementById('destinationCity');

        if (!carName || isNaN(carPrice) || !searchDate || !departureCity || !destinationCity) {
            throw new Error('Données de réservation incomplètes');
        }

        const searchDateValue = searchDate.value;
        if (!searchDateValue) {
            throw new Error('Veuillez sélectionner une date');
        }

        // Récupération des sections
        const reservationSection = document.getElementById('reservation');
        const fleetSection = document.getElementById('vehicules');

        if (!reservationSection || !fleetSection) {
            throw new Error('Sections de réservation manquantes');
        }

        // Mise à jour des informations de réservation
        const selectedCarName = document.getElementById('selectedCarName');
        const selectedCarPrice = document.getElementById('selectedCarPrice');
        const selectedDate = document.getElementById('selectedDate');
        const reservationForm = document.getElementById('reservationForm');

        if (!selectedCarName || !selectedCarPrice || !selectedDate || !reservationForm) {
            throw new Error('Éléments de formulaire manquants');
        }

        selectedCarName.textContent = carName;
        selectedCarPrice.textContent = `${carPrice}€ /jour`;
        reservationForm.setAttribute('data-price', carPrice);

        // Ajout des informations de trajet
        const departureCityValue = departureCity.options[departureCity.selectedIndex].text;
        const destinationCityValue = destinationCity.options[destinationCity.selectedIndex].text;
        selectedDate.textContent = `Trajet : ${departureCityValue} → ${destinationCityValue} | Date: ${searchDateValue}`;

        // Mise à jour des champs cachés
        const inputSelectedCar = document.getElementById('inputSelectedCar');
        const inputSelectedDate = document.getElementById('inputSelectedDate');
        const inputTotalEstimate = document.getElementById('inputTotalEstimate');

        if (inputSelectedCar && inputSelectedDate && inputTotalEstimate) {
            inputSelectedCar.value = carName;
            inputSelectedDate.value = searchDateValue;
            inputTotalEstimate.value = document.getElementById('estimatedTotal')?.textContent || '';
        }

        // Affichage du formulaire
        reservationSection.classList.remove('hidden');
        fleetSection.classList.add('hidden');
        reservationSection.scrollIntoView({ behavior: 'smooth' });
        
        // Calcul initial du total
        calculateTotal();
    } catch (error) {
        console.error('Erreur lors de l\'affichage du formulaire:', error);
        alert(error.message || 'Une erreur est survenue lors de l\'affichage du formulaire');
    }
}

// Amélioration de la gestion des erreurs dans le formulaire de soumission
document.getElementById('reservationForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    try {
        const form = this;
        calculateTotal();

        // Validation des champs requis
        const requiredFields = ['nom', 'prenom', 'email', 'telephone'];
        const missingFields = requiredFields.filter(field => !form[field].value.trim());
        
        if (missingFields.length > 0) {
            throw new Error(`Veuillez remplir les champs suivants : ${missingFields.join(', ')}`);
        }

        // Validation de l'email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(form.email.value)) {
            throw new Error('Veuillez entrer une adresse email valide');
        }

        // Validation du téléphone
        const phoneRegex = /^\+?[0-9]{10,15}$/;
        if (!phoneRegex.test(form.telephone.value.replace(/\s/g, ''))) {
            throw new Error('Veuillez entrer un numéro de téléphone valide');
        }

        // Mise à jour des champs cachés
        document.getElementById('inputSelectedCar').value = document.getElementById('selectedCarName').textContent;
        document.getElementById('inputSelectedDate').value = document.getElementById('selectedDate').textContent;
        document.getElementById('inputTotalEstimate').value = document.getElementById('estimatedTotal').textContent;

        // Envoi du formulaire
        fetch(form.action, {
            method: "POST",
            body: new FormData(form),
            headers: { 'Accept': 'application/json' }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur réseau lors de l\'envoi du formulaire');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                form.reset();
                const confirmation = document.createElement('div');
                confirmation.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-green-600 text-white px-8 py-4 rounded-lg shadow-xl z-50 text-center min-w-[300px]';
                confirmation.textContent = data.message || 'Votre réservation a été enregistrée avec succès.';
                document.body.appendChild(confirmation);
                setTimeout(() => {
                    confirmation.remove();
                    window.location.href = 'index.html';
                }, 3000);
            } else {
                throw new Error(data.message || 'Une erreur est survenue lors de l\'envoi du formulaire');
            }
        })
        .catch(error => {
            throw error;
        });
    } catch (error) {
        console.error('Erreur lors de la soumission du formulaire:', error);
        alert(error.message || 'Une erreur est survenue lors de l\'envoi du formulaire');
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const dateInput = document.getElementById('searchDate');
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
    addEventListeners();
});
// Gestionnaire du menu mobile amélioré
document.getElementById('mobile-menu-button').addEventListener('click', function(e) {
    e.stopPropagation();
    const menu = document.getElementById('mobile-menu');
    menu.classList.toggle('hidden');

    const closeMenu = (evt) => {
        if (!menu.contains(evt.target) && !evt.target.closest('#mobile-menu-button')) {
            menu.classList.add('hidden');
            document.removeEventListener('click', closeMenu);
        }
    };
    document.addEventListener('click', closeMenu);
});
window.addEventListener('scroll', () => {
    const backButton = document.getElementById('backToTop');
    backButton.classList.toggle('hidden', window.scrollY < 500);
    backButton.classList.toggle('animate-bounce', window.scrollY > 500);
  });
