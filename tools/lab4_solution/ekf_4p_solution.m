% Codigo para Filtro Kalman Extendido
% Robôs futebol robótico com câmara móvel no topo

clear all;
N=300;
p_count=0;

% estado inicial do robô
x=[2 -1.5 0]';

% sinais de controlo do robô
% velocidade linear
v_t=randn(1,N)+1;
% velocidade de rotação
omega_t=randn(1,N)*0.5+0.6;
% vetor com velocidades de referência para o robô
u_t=[ v_t ; omega_t ];

% covariancias
P=eye(3)*1e-3;
% ajustar este valores de modo a aobter-se a melhor relação enter
% velocidade de convergência e sensibilidade ao ruído das medidas
Q=[0.1^2 0
    0    0.05^2];

% desvio padrão do erro das medidas dos postes
sdv_dist_1m=0.05;
sdv_ang=0.01;

% variáveis para registo da simulação
x_t=[];
x_e_t=[];

% localização dos postes
xp(1)=5;
yp(1)=-2.5;
xp(2)=5;
yp(2)=2.5;
xp(3)=-5;
yp(3)=-2.5;
xp(4)=-5;
yp(4)=2.5;

% valor inicial do estado estimado
x_e=[2.5 -2.5 0]';
xr_e=x_e(1); 
yr_e=x_e(2); 
theta_r_e=x_e(3);

% periodo de controlo
dt=0.040;

for i=1:N
  % registo da evolução dos estados  
  x_t=[x_t x];
  x_e_t=[x_e_t x_e];
    
  % Simulação do robô
  v=u_t(1,i);
  omega=u_t(2,i);
  TSPAN=[0,dt];
  [T,X]=ode45('robot_5dpo',TSPAN,x,[],[v omega]);
  x=X(size(X,1),:)';
  xr=x(1); 
  yr=x(2); 
  theta_r=x(3);
 
  %propagação da estimativa do estado do robô X(k+1) = f(X(k),U)
  xr_e=x_e(1); 
  yr_e=x_e(2); 
  theta_r_e=x_e(3);  
  xr_e=xr_e+v*cos(theta_r_e+omega*dt/2)*dt; 
  yr_e=yr_e+v*sin(theta_r_e+omega*dt/2)*dt; 
  theta_r_e=theta_r_e+omega*dt;  
  x_e=[xr_e ; yr_e ; theta_r_e];
  
  % calculo de grad_f_X=df/dX 
  grad_f_X=[ 1 0 -v*dt*sin(theta_r_e+omega*dt/2);
      0 1 v*dt*cos(theta_r_e+omega*dt/2);
      0 0 1];
  
  % calculo de grad_f_U=df/dU
  grad_f_U=[cos(theta_r_e+omega*dt/2) -v*dt*0.5*sin(theta_r_e+omega*dt/2); 
      sin(theta_r_e+omega*dt/2) v*dt*0.5*cos(theta_r_e+omega*dt/2); 
      0 1];
  
  % propagação da covariancia 
  P = grad_f_X * P * grad_f_X' + grad_f_U*Q*grad_f_U';
  
  j=1;
  
  while(j<=3)
    % simulação das medidas observadas
    distp=sqrt((xp(j)-xr)^2+(yp(j)-yr)^2);
    distp_medido=distp+randn(1)*sdv_dist_1m*distp;
    theta_p=atan2(yp(j)-yr,xp(j)-xr)-theta_r;
    theta_p_medido = NormalizeAng(theta_p + randn(1)*sdv_ang);
    z=[distp_medido; theta_p_medido];
  
    % valor esperado para as medidas tendo em conta o estado do robô z=h(X)
    distp_e= sqrt((xp(j)-xr_e)^2+(yp(j)-yr_e)^2);
    theta_p_e=NormalizeAng(atan2(yp(j)-yr_e,xp(j)-xr_e)-theta_r_e);
    z_e=[distp_e; theta_p_e];

    
    % matriz de covariancia do ruído das medidas
    R= [ (distp_e*sdv_dist_1m)^2 0 
        0 sdv_ang^2 ];
 
     
    % calculo de dH/dX
    grad_h_X  = [-(xp(j)-xr_e)/distp_e, -(yp(j)-yr_e)/distp_e, 0;
                 (yp(j)-yr_e)/(distp_e^2), -(xp(j)-xr_e)/(distp_e^2), -1];            
  
 
    % Kalman Gain
    k = P * grad_h_X' * inv(grad_h_X * P * grad_h_X' + R);

    % Actualização da covariencia
    P=(eye(3)-k * grad_h_X) * P;
  
    z_diff = z - z_e;
    z_diff(2) = NormalizeAng(z_diff(2));
    % Actualiz estado estimado
    x_e = x_e + k * z_diff;      

    xr_e=x_e(1); 
    yr_e=x_e(2); 
    theta_r_e=x_e(3);
  
    j=j+1;
  
  end;
  
  
end

% visualização dos resultados
L=0.01;
plot (  x_t(1,:),   x_t(2,:) ,'o',  ...
        x_t(1,:)+L*cos(x_t(3,:)),   x_t(2,:)+L*sin(x_t(3,:)) ,'.'   , ...
        x_e_t(1,:),   x_e_t(2,:) ,'o',  ...
        x_e_t(1,:)+L*cos(x_e_t(3,:)),   x_e_t(2,:)+L*sin(x_e_t(3,:)) ,'.' ,  ...
        xp(1),yp(1) ,'bp' , xp(2),yp(2), 'rh', ...
        xp(3),yp(3) ,'bp', xp(4),yp(4), 'rh' ...
        ),
legend(   'xy',          'dir', 'xy_e',          'dir_e', 'Pole 1',  'Pole 2'), 


         
