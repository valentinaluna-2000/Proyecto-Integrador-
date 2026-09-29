import { Global, Module, Injectable, OnApplicationShutdown } from '@nestjs/common';
import { DataSource } from 'typeorm';
import source from './data-source';
@Injectable()
class PersistenceLifecycle implements OnApplicationShutdown {
  constructor(private readonly db: DataSource) {}
  async onApplicationShutdown() {
    if (this.db.isInitialized) await this.db.destroy();
  }
}
@Global()
@Module({
  providers: [{ provide: DataSource, useFactory: () => source.initialize() }, PersistenceLifecycle],
  exports: [DataSource],
})
export class PersistenciaModule {}
