CREATE SCHEMA decencord_server;

CREATE TABLE decencord_server.users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
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

CREATE TABLE decencord_server.messages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    channel_id INTEGER,
    FOREIGN KEY (user_id) REFERENCES decencord_server.users(id)
    FOREIGN KEY (channel_id) REFERENCES decencord_server.channels(id)
);

-- Add some test data

INSERT INTO decencord_server.users (username, password) VALUES ('Alice', 'password1');
INSERT INTO decencord_server.users (username, password) VALUES ('Bob', 'password2');
INSERT INTO decencord_server.users (username, password) VALUES ('Charlie', 'password3');

INSERT INTO decencord_server.channels (name, id, type) VALUES ('General', '1', 'text');


INSERT INTO decencord_server.messages (user_id, content, channel_id) VALUES (1, 'Hello, world!', '1');
INSERT INTO decencord_server.messages (user_id, content, channel_id) VALUES (2, 'Hi, Alice!', '1');
INSERT INTO decencord_server.messages (user_id, content, channel_id) VALUES (3, 'Hey, Bob!', '1');


