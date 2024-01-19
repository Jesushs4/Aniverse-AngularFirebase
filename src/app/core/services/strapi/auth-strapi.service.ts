
import { Observable, lastValueFrom, map} from 'rxjs';
import { UserCredentials } from '../../interfaces/user-credentials';
import { UserRegisterInfo } from '../../interfaces/user-register-info';
import { JwtService } from '../http/jwt.service';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { StrapiExtendedUser, StrapiLoginPayload, StrapiLoginResponse, StrapiRegisterPayload, StrapiRegisterResponse, StrapiUser } from '../../interfaces/strapi';
import { User } from '../../interfaces/user';



export class AuthStrapiService extends AuthService{

  constructor(
    private jwtService:JwtService,
    private apiService:ApiService
  ) { 
    super();
    this.init();
  }

  private init(){
    this.jwtService.loadToken().subscribe(_=>{
      this._logged.next(true);
    });
  }

  public login(credentials:UserCredentials):Observable<void>{
    return new Observable<void>(obs=>{
      const _credentials:StrapiLoginPayload = {
        identifier:credentials.username,
        password:credentials.password
      };
      this.apiService.post("/auth/local", _credentials).subscribe({
        next:async (data:StrapiLoginResponse)=>{
          await lastValueFrom(this.jwtService.saveToken(data.jwt));
          let connected = data && data.jwt!='';
          this._logged.next(connected);
          obs.next();
          obs.complete();
        },
        error:err=>{
          obs.error(err);
        }
      });
    });
  }

  logout():Observable<void>{
    return this.jwtService.destroyToken().pipe(map(_=>{
      return;
    }));
  }

  register(info:UserRegisterInfo):Observable<void>{
    return new Observable<void>(obs=>{
      const _info:StrapiRegisterPayload = {
        email:info.email,
        username:info.username,
        password:info.password,
      }
      this.apiService.post("/auth/local/register", info).subscribe({
        next:async (data:StrapiRegisterResponse)=>{
          let connected = data && data.jwt!='';
          this._logged.next(connected);
          await lastValueFrom(this.jwtService.saveToken(data.jwt));
          console.log(data.user.id);
          const _extended_user:StrapiExtendedUser= {
            data: {
              user_id:data.user.id,
              nickname:info.nickname
            }
            
          }
          await lastValueFrom(this.apiService.post("/extended-users", _extended_user));
          obs.next();
          obs.complete();
        },
        error:err=>{
          obs.error(err);
        }
      });
    });
  }

  public me():Observable<User>{
    return new Observable<User>(obs=>{
      this.apiService.get('/users/me').subscribe({
        next:async (user:StrapiUser)=>{
          let extended_user = await lastValueFrom(this.apiService.get(`/extended-users?filters[user_id]=${user.id}`));
          let ret:User = {
            id: user.id,
            name: user.username,
            nickname: extended_user.data[0].attributes.nickname,
            email: user.email
          }
          obs.next(ret);
          obs.complete();
        },
        error: err=>{
          obs.error(err);
        }
      });
    });
    
  }
}
