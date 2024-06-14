CREATE SCHEMA decencord_server;

CREATE TABLE decencord_server.users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE decencord_server.messages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES decencord_server.users(id)
);

-- Add some test data

INSERT INTO decencord_server.users (username) VALUES ('Alice');
INSERT INTO decencord_server.users (username) VALUES ('Bob');
INSERT INTO decencord_server.users (username) VALUES ('Charlie');

INSERT INTO decencord_server.messages (user_id, content) VALUES (1, 'Hello, world!');
INSERT INTO decencord_server.messages (user_id, content) VALUES (2, 'Hi, Alice!');
INSERT INTO decencord_server.messages (user_id, content) VALUES (3, 'Hi, Bob!');
