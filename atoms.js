/* https://iquilezles.org/articles/distfunctions2d/ */
export const atoms = `
float dot2(in vec2 v) {
  return dot(v, v);
}

float sdCornerCircle(in vec2 p) {
  return length(p - vec2(0.0, -1.0)) - sqrt(2.0);
}

float boxAtom(in vec2 p, in vec2 b, in vec4 r) {
  // select corner radius
  r.xy = (p.x > 0.0) ? r.xy : r.zw;
  r.x  = (p.y > 0.0) ? r.x  : r.y;
  // box coordinates
  vec2 q = abs(p) - b + r.x;
  // distance to sides
  if(min(q.x, q.y) < 0.0) return max(q.x, q.y) - r.x;
  // rotate 45 degrees, offset by r and scale by r*sqrt(0.5) to canonical corner coordinates
  vec2 uv = vec2(abs(q.x - q.y), q.x + q.y - r.x )/r.x;
  // compute distance to corner shape
  float d = sdCornerCircle(uv);
  // undo scale
  return d * r.x * sqrt(0.5);
}

float plainBox(in vec2 p, in vec2 b) {
  return boxAtom(p, b, vec4(0.01, 0.01, 0.01, 0.01));
}

float circle( vec2 p, float r ) {
  return length(p) - r;
}

float heart( in vec2 p ) {
  p.x = abs(p.x);
  if( p.y+p.x>1.0 )
    return sqrt(dot2(p-vec2(0.25,0.75))) - sqrt(2.0)/4.0;
  return sqrt(min(dot2(p-vec2(0.00,1.00)),
                  dot2(p-0.5*max(p.x+p.y,0.0)))) * sign(p.x-p.y);
}

float moon(vec2 p, float d, float ra, float rb) {
  p.y = abs(p.y);
  float a = (ra*ra - rb*rb + d*d)/(2.0*d);
  float b = sqrt(max(ra*ra-a*a,0.0));
  if( d*(p.x*b-p.y*a) > d*d*max(b-p.y,0.0) )
        return length(p-vec2(a,b));
  return max( (length(p          )-ra),
             -(length(p-vec2(d,0))-rb));
}

float star(in vec2 p, in float r, in float rf) {
  const vec2 k1 = vec2(0.809016994375, -0.587785252292);
  const vec2 k2 = vec2(-k1.x,k1.y);
  p.x = abs(p.x);
  p -= 2.0*max(dot(k1,p),0.0)*k1;
  p -= 2.0*max(dot(k2,p),0.0)*k2;
  p.x = abs(p.x);
  p.y -= r;
  vec2 ba = rf*vec2(-k1.y,k1.x) - vec2(0,1);
  float h = clamp( dot(p,ba)/dot(ba,ba), 0.0, r );
  return length(p-ba*h) * sign(p.y*ba.x-p.x*ba.y);
}

float triangle( in vec2 p, in float r ) {
  const float k = sqrt(3.0);
  p.x = abs(p.x) - r;
  p.y = p.y + r/k;
  if( p.x+k*p.y>0.0 ) p = vec2(p.x-k*p.y,-k*p.x-p.y)/2.0;
  p.x -= clamp( p.x, -2.0*r, 0.0 );
  return -length(p)*sign(p.y);
}

float coolS(in vec2 p) {
  float six = (p.y < 0.0) ? -p.x : p.x;
  p.x = abs(p.x);
  p.y = abs(p.y) - 0.2;
  float rex = p.x - min(round(p.x/0.4),0.4);
  float aby = abs(p.y - 0.2) - 0.6;
    
  float d = dot2(vec2(six,-p.y)-clamp(0.5*(six-p.y),0.0,0.2));
  d = min(d,dot2(vec2(p.x,-aby)-clamp(0.5*(p.x-aby),0.0,0.4)));
  d = min(d,dot2(vec2(rex,p.y  -clamp(p.y          ,0.0,0.4))));
    
  float s = 2.0*p.x + aby + abs(aby+0.4) - 0.4;
  return sqrt(d) * sign(s);
}

float ellipse(in vec2 p, in vec2 ab) {
  p = abs(p); if( p.x > p.y ) {p=p.yx;ab=ab.yx;}
  float l = ab.y*ab.y - ab.x*ab.x;
  float m = ab.x*p.x/l;      float m2 = m*m; 
  float n = ab.y*p.y/l;      float n2 = n*n; 
  float c = (m2+n2-1.0)/3.0; float c3 = c*c*c;
  float q = c3 + m2*n2*2.0;
  float d = c3 + m2*n2;
  float g = m + m*n2;
  float co;
  if( d<0.0 ) {
    float h = acos(q/c3)/3.0;
    float s = cos(h);
    float t = sin(h)*sqrt(3.0);
    float rx = sqrt( -c*(s + t + 2.0) + m2 );
    float ry = sqrt( -c*(s - t + 2.0) + m2 );
    co = (ry+sign(l)*rx+abs(g)/(rx*ry)- m)/2.0;
  } else {
    float h = 2.0*m*n*sqrt( d );
    float s = sign(q+h)*pow(abs(q+h), 1.0/3.0);
    float u = sign(q-h)*pow(abs(q-h), 1.0/3.0);
    float rx = -s - u - c*4.0 + 2.0*m2;
    float ry = (s - u)*sqrt(3.0);
    float rm = sqrt( rx*rx + ry*ry );
    co = (ry/sqrt(rm-rx)+2.0*g/rm-m)/2.0;
  }
  vec2 r = ab * vec2(co, sqrt(1.0-co*co));
  return length(r-p) * sign(p.y-r.y);
}
`;