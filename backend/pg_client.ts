import pg from "pg";

const pg_client = new pg.Client({
   user: "postgres",
   host: "localhost",
   database: "postgres",
   password: "postgres",
   port: 5432,
});

pg_client.asyncQuery = async (...args) => {
   return new Promise((resolve, reject) => {
      pg_client.query(...args, (err, res) => {
         if (err) {
            reject(err);
            return;
         }
         resolve(res);
      });
   });
};

pg_client.connect();

export default pg_client;
