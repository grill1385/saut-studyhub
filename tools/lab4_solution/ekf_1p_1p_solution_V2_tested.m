% Extended Kalman Filter
% Soccer Robots with mobile camera on top
clear all;
N=300;
p_count=0;

% initial state of the robot
X=[2 -2 0]';

% robot control signals
% linear velocity
v_t=randn(1,N)+1;
% angular velocity
omega_t=randn(1,N)*0.5+0.5;
% vector with reference speeds
u_t=[ v_t ; omega_t ];

% Covariances:

% initail covariance for the estimatin
P=eye(3)*1e-2;

% adjust motion model covariance to obtain the better relation between 
% convergence speed and sensibility to noise
Q=[0.0005^2 0
    0    0.0005^2];

% standard deviation for the beacons measures
sdv_dist_1m=0.05;
sdv_ang=0.01;

% variables to record simulation
X_t=[];
X_e_t=[];
Zmed=[];
Zest=[];
Ks=[];

% beacons coordinates
xp1=5;
yp1=-2.5;
xp2=5;
yp2=2.5;

% initial value for the estimated state
X_e=[2.5 -2.5 0]';
xr_e=X_e(1); 
yr_e=X_e(2); 
theta_r_e=X_e(3);

% sampling period
dt=0.040;

for i=1:N
  % robot simulation
  v=u_t(1,i);
  omega=u_t(2,i);
  TSPAN=[0,dt];
  [T,Xs]=ode45('robot_5dpo',TSPAN,X,[],[v omega]);
  X=Xs(size(Xs,1),:)';
  xr=X(1); 
  yr=X(2);
  X(3)= NormalizeAng(X(3));
  theta_r=X(3);
 
  % state propagation with motion model, X(k+1) = f(X(k),U)
  xr_e=X_e(1); 
  yr_e=X_e(2); 
  theta_r_e=X_e(3);  
  xr_e=xr_e+v*cos(theta_r_e+omega*dt/2)*dt; 
  yr_e=yr_e+v*sin(theta_r_e+omega*dt/2)*dt; 
  theta_r_e=NormalizeAng(theta_r_e+omega*dt);  
  X_e=[xr_e ; yr_e ; theta_r_e];
  
  % grad_f_X=df/dX 
  grad_f_X=[ 1 0 -v*dt*sin(theta_r_e+omega*dt/2);
      0 1 v*dt*cos(theta_r_e+omega*dt/2);
      0 0 1];
  
  % grad_f_U=df/dU
  grad_f_U=[cos(theta_r_e+omega*dt/2) -v*dt*0.5*sin(theta_r_e+omega*dt/2); 
      sin(theta_r_e+omega*dt/2) v*dt*0.5*cos(theta_r_e+omega*dt/2); 
      0 1];
  
   % covariance propagation
  P = grad_f_X * P * grad_f_X' + grad_f_U*Q*grad_f_U';

  % commutation between beacons
  p_count=p_count+1;
  if p_count==100
    p_count=0;
  end  
  
  if p_count<=50         
    % simulation of the measuress
    distp=sqrt((xp1-xr)^2+(yp1-yr)^2);
    distp_medido=distp+randn(1)*sdv_dist_1m*distp;
    theta_p= NormalizeAng(atan2(yp1-yr,xp1-xr)-theta_r);
    theta_p_medido = NormalizeAng(theta_p + randn(1)*sdv_ang);
    z=[distp_medido; theta_p_medido];
    
    % expected measures with the actual robot state, z=h(X)
    distp_e= sqrt((xp1-xr_e)^2+(yp1-yr_e)^2);
    theta_p_e=NormalizeAng(atan2(yp1-yr_e,xp1-xr_e)-theta_r_e);
    z_e=[distp_e; theta_p_e];
    
    % covariance matrix for the measures
    R= [ (distp_e*sdv_dist_1m)^2 0 
        0 sdv_ang^2 ];
    
    % grad_h_X = dH/dX
    grad_h_X  = [-(xp1-xr_e)/distp_e, -(yp1-yr_e)/distp_e, 0;
                 (yp1-yr_e)/(distp_e^2), -(xp1-xr_e)/(distp_e^2), -1];            
  else  
    % simulação das medidas observadas
    distp=sqrt((xp2-xr)^2+(yp2-yr)^2);
    distp_medido=distp+randn(1)*sdv_dist_1m*distp;
    theta_p=NormalizeAng(atan2(yp2-yr,xp2-xr)-theta_r);
    theta_p_medido = NormalizeAng(theta_p + randn(1)*sdv_ang);
    z=[distp_medido; theta_p_medido];
    
    % valor esperado para as medidas tendo em conta o estado do robô z=h(X)
    distp_e= sqrt((xp2-xr_e)^2+(yp2-yr_e)^2);
    theta_p_e=NormalizeAng(atan2(yp2-yr_e,xp2-xr_e)-theta_r_e);
    z_e=[distp_e; theta_p_e];
    
    % matriz de covariancia do ruído das medidas
    R= [ (distp_e*sdv_dist_1m)^2 0 
        0 sdv_ang^2 ];
    
    % calculo de dH/dX
    grad_h_X  = [-(xp2-xr_e)/distp_e, -(yp2-yr_e)/distp_e, 0;
                 (yp2-yr_e)/(distp_e^2), -(xp2-xr_e)/(distp_e^2), -1];
  end;        
 
 
  % Kalman Gain
  k = P * grad_h_X' * inv(grad_h_X * P * grad_h_X' + R);

  % Covariance update
  P=(eye(3)-k * grad_h_X) * P;
  
  % State update
  z_dif = z-z_e;
  z_dif(2)= NormalizeAng(z_dif(2)); 
  X_e = X_e + k * (z_dif);  
  X_e(3) = NormalizeAng(X_e(3));
  
  % record results  
  X_t=[X_t X];
  X_e_t=[X_e_t X_e];
  Zmed=[Zmed z];
  Zest=[Zest z_e];
  Ks=[Ks k];
end

% Results visualization
L=0.01;
plot (  X_t(1,:),   X_t(2,:) ,'o',  ...
        X_t(1,:)+L*cos(X_t(3,:)),   X_t(2,:)+L*sin(X_t(3,:)) ,'.'   , ...
        X_e_t(1,:),   X_e_t(2,:) ,'o',  ...
        X_e_t(1,:)+L*cos(X_e_t(3,:)),   X_e_t(2,:)+L*sin(X_e_t(3,:)) ,'.' ,  ...
        xp1,yp1 ,'p', xp2,yp2, 'h' ...
        ),
legend(   'xy',          'dir', 'xy_e',          'dir_e', 'Pole 1',  'Pole 2' ), 


         
