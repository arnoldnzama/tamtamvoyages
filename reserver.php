<?php
require_once 'config.php';

// Ajout d'en-têtes de sécurité
header("X-Content-Type-Options: nosniff");
header("X-Frame-Options: DENY");
header("X-XSS-Protection: 1; mode=block");
header('Content-Type: application/json');

try {
    if ($_SERVER["REQUEST_METHOD"] != "POST") {
        throw new Exception("Méthode non autorisée");
    }

    // Validation des données
    $errors = [];
    
    // Validation des champs obligatoires
    $required_fields = ['nom', 'prenom', 'email', 'telephone', 'voiture', 'date', 'total'];
    foreach ($required_fields as $field) {
        if (empty($_POST[$field])) {
            $errors[] = "Le champ $field est obligatoire";
        }
    }
    
    // Validation du nombre de passagers
    if (!empty($_POST['passagers'])) {
        $passagers = (int)$_POST['passagers'];
        if ($passagers < 1 || $passagers > 7) {
            $errors[] = "Le nombre de passagers doit être entre 1 et 7";
        }
    }

    // Validation du total
    if (!empty($_POST['total'])) {
        $total = str_replace([' €', ' '], '', $_POST['total']);
        if (!is_numeric($total) || $total < 0) {
            $errors[] = "Le montant total n'est pas valide";
        }
    }
    
    // Validation de l'email
    if (!empty($_POST['email']) && !filter_var($_POST['email'], FILTER_VALIDATE_EMAIL)) {
        $errors[] = "L'adresse email n'est pas valide";
    }
    
    // Validation du téléphone (format international)
    if (!empty($_POST['telephone']) && !preg_match('/^\+?[0-9]{10,15}$/', $_POST['telephone'])) {
        $errors[] = "Le numéro de téléphone n'est pas valide";
    }
    
    if (!empty($errors)) {
        throw new Exception(implode("\n", $errors));
    }

    // Connexion à la base de données
    $conn = getDBConnection();
    
    // Préparation des données
    $nom = $conn->real_escape_string($_POST['nom']);
    $prenom = $conn->real_escape_string($_POST['prenom']);
    $email = $conn->real_escape_string($_POST['email']);
    $telephone = $conn->real_escape_string($_POST['telephone']);
    $voiture = $conn->real_escape_string($_POST['voiture']);
    $date = $conn->real_escape_string($_POST['date']);
    $passagers = (int)$_POST['passagers'];
    $bagage = isset($_POST['bagage']) ? 1 : 0;
    $enfant = isset($_POST['enfant']) ? 1 : 0;
    $total = $conn->real_escape_string(str_replace([' €', ' '], '', $_POST['total']));

    // Insertion de la réservation
    $sql = "INSERT INTO reservations (nom, prenom, email, telephone, voiture, date_reservation, passagers, bagage, enfant, total, statut)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'En attente')";
            
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception("Erreur lors de la préparation de la requête : " . $conn->error);
    }

    $stmt->bind_param("ssssssiiis", $nom, $prenom, $email, $telephone, $voiture, $date, $passagers, $bagage, $enfant, $total);

    if (!$stmt->execute()) {
        throw new Exception("Erreur lors de l'enregistrement de la réservation : " . $stmt->error);
    }

    $reservation_id = $conn->insert_id;
    $approve_token = bin2hex(random_bytes(32));
    $reject_token = bin2hex(random_bytes(32));
    $token_expiry = date('Y-m-d H:i:s', strtotime('+24 hours'));
    
    // Mise à jour des tokens
    $token_sql = "UPDATE reservations SET approve_token = ?, reject_token = ?, token_expiry = ? WHERE id = ?";
    $token_stmt = $conn->prepare($token_sql);
    if (!$token_stmt) {
        throw new Exception("Erreur lors de la préparation de la requête des tokens : " . $conn->error);
    }

    $token_stmt->bind_param("sssi", $approve_token, $reject_token, $token_expiry, $reservation_id);
    
    if (!$token_stmt->execute()) {
        throw new Exception("Erreur lors de la mise à jour des tokens : " . $token_stmt->error);
    }

    // Préparation des liens d'approbation/rejet
    $approve_link = SITE_URL . "/php/approve_reservation.php?id=" . $reservation_id . "&token=" . $approve_token;
    $reject_link = SITE_URL . "/php/reject_reservation.php?id=" . $reservation_id . "&token=" . $reject_token;
    
    // Email à l'administrateur
    $admin_message = "Une nouvelle demande de réservation a été reçue :\n\n" .
                    "ID Réservation: #$reservation_id\n" .
                    "Nom: $prenom $nom\n" .
                    "Email: $email\n" .
                    "Téléphone: $telephone\n" .
                    "Voiture: $voiture\n" .
                    "Date: $date\n" .
                    "Passagers: $passagers\n" .
                    "Bagage Supplémentaire: " . ($bagage ? 'Oui (+20€)' : 'Non') . "\n" .
                    "Enfant: " . ($enfant ? 'Oui (+25€)' : 'Non') . "\n" .
                    "Total estimé: " . number_format((float)$total, 2) . " €\n\n" .
                    "Pour approuver ou rejeter cette réservation, utilisez les liens suivants :\n" .
                    "Approuver : $approve_link\n" .
                    "Rejeter : $reject_link\n\n" .
                    "Ces liens expireront dans 24 heures.";

    if (!sendEmail(ADMIN_EMAIL, "Nouvelle demande de réservation #$reservation_id - TamtamVoyages", $admin_message)) {
        error_log("Erreur lors de l'envoi de l'email à l'administrateur pour la réservation #$reservation_id");
    }

    // Email de confirmation au client
    $client_message = "Bonjour $prenom $nom,\n\n" .
                     "Nous avons bien reçu votre demande de réservation :\n\n" .
                     "Véhicule : $voiture\n" .
                     "Date : $date\n" .
                     "Nombre de passagers : $passagers\n" .
                     "Options :\n" .
                     "- Bagage supplémentaire : " . ($bagage ? 'Oui (+20€)' : 'Non') . "\n" .
                     "- Option enfant : " . ($enfant ? 'Oui (+25€)' : 'Non') . "\n" .
                     "Total estimé : " . number_format((float)$total, 2) . " €\n\n" .
                     "Nous vous informerons par email dès que votre réservation sera approuvée ou rejetée.\n\n" .
                     "Merci de votre confiance.\n\n" .
                     "L'équipe TamtamVoyages";

    if (!sendEmail($email, "Confirmation de votre demande de réservation - TamtamVoyages", $client_message)) {
        error_log("Erreur lors de l'envoi de l'email de confirmation au client pour la réservation #$reservation_id");
    }

    // Réponse de succès
    echo json_encode([
        'success' => true,
        'message' => 'Votre réservation a été enregistrée avec succès. Vous recevrez un email de confirmation sous peu.'
    ]);

} catch (Exception $e) {
    error_log("Erreur dans reserver.php : " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
} finally {
    if (isset($stmt)) $stmt->close();
    if (isset($token_stmt)) $token_stmt->close();
    if (isset($conn)) $conn->close();
}
?>