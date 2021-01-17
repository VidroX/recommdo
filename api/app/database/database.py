from odmantic import AIOEngine


class Database:
    engine: AIOEngine = None
    database = None


db = Database()
