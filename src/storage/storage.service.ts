import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Client } from 'minio';
import { ConfigService } from '../config/config.service';
import { wait } from '../core/helpers';

@Injectable()
export class StorageService {
  /** Client that stores files */
  private client: Client;

  /** Bucket name */
  private bucket: string;

  /** Logger */
  private logger = new Logger();

  constructor(private readonly config: ConfigService) {
    const endPoint = this.config.get('STORAGE_HOST');
    const accessKey = this.config.get('STORAGE_ACCESS_KEY');
    const secretKey = this.config.get('STORAGE_SECRET_KEY');
    const bucket = this.config.get('STORAGE_BUCKET_NAME');

    if (!bucket || !endPoint || !accessKey || !secretKey) {
      new Logger().error('Storage is in use, and storage keys are not defined');
      throw new InternalServerErrorException();
    }

    this.bucket = bucket;
    this.client = new Client({
      endPoint,
      accessKey,
      secretKey,
      port: 9000,
      useSSL: false,
    });
  }

  async put(image: Buffer, name: string): Promise<string> {
    return new Promise((res: (value: string) => any, rej) => {
      this.client.putObject(
        this.bucket,
        name,
        image,
        image.byteLength,
        { 'Content-Type': 'image/jpeg' },
        async (error: any) => {
          if (error !== null) {
            /* Dirty code, but it works */
            /* Backblaze often returns 500 errors,  */
            /* After 3 times with a same file, stop trying */
            this.logger.warn('B2 returned error, try again. File name:', name);

            if (error.code === 'InternalError') {
              await wait(200);
              this.put(image, name)
                .then(res)
                .catch(err => this.put(image, name))
                .then(res)
                .catch(rej);
            } else {
              this.logger.error('B2 non fixable error ');
              rej(error);
            }
          } else {
            // res(result);
            res(`/${this.bucket}/${name}`);
          }
        },
      );
    });
  }

  /** Remove one file */
  async delete(file: string): Promise<void> {
    return new Promise((res, rej) => {
      this.client.removeObject(this.bucket, file, err => {
        if (err === null) res();
        if (err !== null) rej(err);
      });
    });
  }

  /**
   * Deletes many files.
   * Useful when images are stored in many sizes
   * If all images sizes are 2019/05/22/qwer12.xs.jpeg,
   * @param prefix for them is 2019/05/22/qwer12.
   */
  async deleteMany(prefix: string): Promise<unknown> {
    return new Promise((res, rej) => {
      const filenames: string[] = [];
      const filesStream = this.client.listObjectsV2(this.bucket, prefix);
      filesStream.on('data', filename => filenames.push(filename.name));
      filesStream.on('error', rej);

      filesStream.on('end', () => {
        this.client.removeObjects(this.bucket, filenames, err => {
          if (err === null) res(filenames);
          if (err !== null) rej();
        });
      });
    });
  }
}
