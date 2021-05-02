from odmantic import AIOEngine


class Database:
    raw_engine = None
    engine: AIOEngine = None
    database = None


db = Database()
