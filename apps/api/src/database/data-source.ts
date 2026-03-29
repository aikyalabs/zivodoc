import 'dotenv/config';
import { DataSource } from 'typeorm';
import { join } from 'path';

// NOTE: Entity properties use camelCase which TypeORM maps directly to column
// names. Our migrations already define columns in snake_case so each entity
// column that differs uses an explicit `{ name: 'snake_case' }` option.  If you
// prefer automatic conversion, install `typeorm-naming-strategies` and set
// `namingStrategy: new SnakeNamingStrategy()` here.
export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/saas_template',
  entities: [join(__dirname, 'entities/*{.ts,.js}')],
  migrations: [join(__dirname, 'migrations/*{.ts,.js}')],
  synchronize: true,
});
