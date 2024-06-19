CREATE SCHEMA decencord_server;

CREATE TABLE decencord_server.users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE decencord_server.messages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES decencord_server.users(id)
);

CREATE TABLE decencord_server.sessions (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES decencord_server.users(id)
);

CREATE TYPE CHANNEL_TYPE AS ENUM ('voice', 'text');

CREATE TABLE decencord_server.channels (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type CHANNEL_TYPE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add some test data

INSERT INTO decencord_server.users (username, password) VALUES ('Alice', 'password1');
INSERT INTO decencord_server.users (username, password) VALUES ('Bob', 'password2');
INSERT INTO decencord_server.users (username, password) VALUES ('Charlie', 'password3');

INSERT INTO decencord_server.messages (user_id, content) VALUES (1, 'Hello, world!');
INSERT INTO decencord_server.messages (user_id, content) VALUES (2, 'Hi, Alice!');
INSERT INTO decencord_server.messages (user_id, content) VALUES (3, 'Hi, Bob!');

INSERT INTO decencord_server.channels (name, id) VALUES ('General', '1');
