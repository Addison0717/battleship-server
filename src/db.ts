import { createConnection } from 'typeorm'
import { DefaultNamingStrategy } from 'typeorm/naming-strategy/DefaultNamingStrategy'
import { NamingStrategyInterface } from 'typeorm/naming-strategy/NamingStrategyInterface'
import { snakeCase } from 'typeorm/util/StringUtils'
import User from './users/entity'
import { Player, Game } from './games/entities'

class CustomNamingStrategy extends DefaultNamingStrategy implements NamingStrategyInterface {

  tableName(targetName: string, userSpecifiedName: string): string {
    return userSpecifiedName ? userSpecifiedName : snakeCase(targetName) + 's';
  }

  columnName(propertyName: string, customName: string, embeddedPrefixes: string[]): string {
    return snakeCase(embeddedPrefixes.concat(customName ? customName : propertyName).join("_"));
  }

  columnNameCustomized(customName: string): string {
    return customName;
  }

  relationName(propertyName: string): string {
    return snakeCase(propertyName);
  }
}

export default () =>
  createConnection({
    type: "postgres",
    // url: process.env.DATABASE_URL || 'postgres://postgres:secret@localhost:5432/postgres',
    url: process.env.DATABASE_URL || 'postgres://flnkqflbxsjqiw:b6fa44f5050ab0b4c67d71416fc24e4f7691a7f9f09e46fc3a3bbe46a7d6cff0@ec2-54-217-235-159.eu-west-1.compute.amazonaws.com:5432/df797j54u9ge70',
    entities: [
      User,
      Player,
      Game
    ],
    synchronize: true, // careful with this in production!
    logging: true,
    namingStrategy: new CustomNamingStrategy()
  })
    .then(_ => console.log('Connected to Postgres with TypeORM'))
