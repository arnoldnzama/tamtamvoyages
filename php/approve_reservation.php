<?php
require_once '../config.php';

// Ajout d'en-têtes de sécurité
header("X-Content-Type-Options: nosniff");
header("X-Frame-Options: DENY");
header("X-XSS-Protection: 1; mode=block");

// Fonction pour afficher les messages
function displayMessage($title, $message, $type = 'error') {
    $color = $type === 'error' ? '#ff0000' : '#0dbb00';
    echo "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;'>"
        . "<h2 style='color: {$color};'>" . htmlspecialchars($title) . "</h2>"
        . "<p>" . htmlspecialchars($message) . "</p>"
        . "<p><a href='" . SITE_URL . "' style='color: #f5a700;'>Retour au site</a></p>"
        . "</div>";
}

try {
    if (!isset($_GET['id']) || !isset($_GET['token'])) {
        throw new Exception('Paramètres manquants');
    }

    $id = filter_var($_GET['id'], FILTER_VALIDATE_INT);
    $token = filter_var($_GET['token'], FILTER_SANITIZE_STRING);

    if ($id === false || empty($token)) {
        throw new Exception('Paramètres invalides');
    }

    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    
    if ($conn->connect_error) {
        throw new Exception("Erreur de connexion à la base de données");
    }

    // Vérifier si le token est valide et n'a pas expiré
    $check_sql = "SELECT id, token_expiry FROM reservations 
                  WHERE id = ? AND approve_token = ? AND statut = 'En attente'";
    $check_stmt = $conn->prepare($check_sql);
    $check_stmt->bind_param("is", $id, $token);
    $check_stmt->execute();
    $check_result = $check_stmt->get_result();
    
    if ($check_result->num_rows === 0) {
        throw new Exception('Le lien d\'approbation est invalide ou a déjà été utilisé');
    }

    $reservation = $check_result->fetch_assoc();
    
    // Vérifier l'expiration du token
    if (strtotime($reservation['token_expiry']) < time()) {
        throw new Exception('Le lien d\'approbation a expiré');
    }

    // Mettre à jour le statut et invalider le token
    $update_sql = "UPDATE reservations 
                   SET statut = 'Approuvée', 
                       approve_token = NULL, 
                       reject_token = NULL, 
                       token_expiry = NULL 
                   WHERE id = ?";
    $update_stmt = $conn->prepare($update_sql);
    $update_stmt->bind_param("i", $id);
    
    if (!$update_stmt->execute()) {
        throw new Exception('Erreur lors de l\'approbation de la réservation');
    }

    // Récupérer les informations de réservation pour l'email
    $info_sql = "SELECT nom, prenom, email, voiture, date_reservation, total 
                 FROM reservations WHERE id = ?";
    $info_stmt = $conn->prepare($info_sql);
    $info_stmt->bind_param("i", $id);
    $info_stmt->execute();
    $info_result = $info_stmt->get_result();
    $reservation = $info_result->fetch_assoc();

    if ($reservation) {
        // Préparation du message email
        $message = "Bonjour " . htmlspecialchars($reservation['prenom']) . " " . htmlspecialchars($reservation['nom']) . ",\n\n" .
                  "Nous avons le plaisir de vous informer que votre réservation a été approuvée :\n\n" .
                  "Véhicule : " . htmlspecialchars($reservation['voiture']) . "\n" .
                  "Date : " . htmlspecialchars($reservation['date_reservation']) . "\n" .
                  "Montant total : " . htmlspecialchars($reservation['total']) . "\n\n" .
                  "Merci de votre confiance.\n\n" .
                  "L'équipe TamtamVoyages";
                  
        $headers = "From: " . ADMIN_EMAIL . "\r\n" .
                  "Reply-To: " . ADMIN_EMAIL . "\r\n" .
                  "X-Mailer: PHP/" . phpversion() . "\r\n" .
                  "Content-Type: text/plain; charset=UTF-8";

        if (!mail($reservation['email'], "Votre réservation a été approuvée - TamtamVoyages", $message, $headers)) {
            error_log("Erreur lors de l'envoi de l'email de confirmation pour la réservation #" . $id);
        }
    }

    displayMessage(
        'Réservation approuvée',
        'La réservation a été approuvée avec succès. Un email de confirmation a été envoyé au client.',
        'success'
    );

} catch (Exception $e) {
    error_log("Erreur dans approve_reservation.php : " . $e->getMessage());
    displayMessage('Erreur', $e->getMessage());
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>