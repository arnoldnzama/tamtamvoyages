
CREATE DATABASE IF NOT EXISTS processr_processr_tamtamvoyages;
USE processr_processr_tamtamvoyages;

CREATE TABLE IF NOT EXISTS reservations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    telephone VARCHAR(20) NOT NULL,
    voiture VARCHAR(100) NOT NULL,
    date_reservation VARCHAR(100) NOT NULL,
    passagers INT NOT NULL DEFAULT 1,
    bagage BOOLEAN NOT NULL DEFAULT 0,
    enfant BOOLEAN NOT NULL DEFAULT 0,
    total VARCHAR(20) NOT NULL,
    statut ENUM('En attente', 'Approuvée', 'Rejetée') DEFAULT 'En attente',
    approve_token VARCHAR(32),
    reject_token VARCHAR(32),
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
