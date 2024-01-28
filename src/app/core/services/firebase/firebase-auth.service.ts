import { Observable, from, map } from 'rxjs';
import { UserCredentials } from '../../interfaces/user-credentials';
import { UserRegisterInfo } from '../../interfaces/user-register-info';
import { User } from '../../interfaces/user';
import { AuthService } from '../auth.service';
import { FirebaseService, FirebaseUserCredential } from '../firebase.service';
import { Injectable } from '@angular/core';


@Injectable({
  providedIn: 'root',
})
export class FirebaseAuthService extends AuthService{

  constructor(
    private firebaseSvc:FirebaseService
  ) { 
    super();
  }

  public login(credentials:UserCredentials):Observable<any>{
      return new Observable<any>(subscr=>{
        this.firebaseSvc.connectUserWithEmailAndPassword(credentials.username, credentials.password).then((credentials:FirebaseUserCredential|null)=>{
          if(!credentials || !credentials.user || !credentials.user.user || !credentials.user.user.uid){
            subscr.error('Cannot login');
          }
          if(credentials){
            this.me().subscribe(data=>{
              this._user.next(data);
              this._logged.next(true);
              subscr.next(data);
              subscr.complete();
            });
          }
        })
      });
  }

  public register(info:UserRegisterInfo):Observable<any|null>{
    console.log("REGISTRO1", info)
    return new Observable<any>(subscr=>{
      this.firebaseSvc.createUserWithEmailAndPassword(info.email, info.password).then((credentials:FirebaseUserCredential|null)=>{
        if(!credentials || !credentials.user || !credentials.user.user || !credentials.user.user.uid)
          subscr.error('Cannot register');
        if(credentials){
          console.log("CREDENTIALS",credentials);
          info.uuid = credentials.user.user.uid;
          this.postRegister(info).subscribe(data=>{
            this._user.next(data);
            this._logged.next(true);
            subscr.next(data);
            subscr.complete();
          });
        }
      })
    });
  }

  private postRegister(info: UserRegisterInfo):Observable<any>{
    console.log("REGISTRO2",info);
    if(info.uuid)
      return from(this.firebaseSvc.createDocumentWithId('users',{
    name:info.username,
    nickname:info.nickname,
    }, info.uuid))
    throw new Error('Error inesperado');
  }

  public me():Observable<User>{
    if(this.firebaseSvc.user?.uid)
      return from(this.firebaseSvc.getDocument('users', this.firebaseSvc.user.uid)).pipe(map(data=>{
        return {
          name:data.data['name'],
          email:data.data['email'],
          nickname:data.data['nickname'],
          uuid:data.id
        }
    }));
    else
      throw new Error('User is not connected');
  }

  public logout(): Observable<any> {
    return from(this.firebaseSvc.signOut(false));
  }
}