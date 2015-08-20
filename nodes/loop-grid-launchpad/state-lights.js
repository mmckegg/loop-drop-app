var self = module.exports = function(r, g, flag){
  if (!r || r < 0)  r = 0
  if (r > 3)        r = 3
  if (!g || g < 0)  g = 0
  if (g > 3)        g = 3
  if (flag == 'flash') {
    flag = 8
  } else if (flag == 'buffer') {
    flag = 0
  } else {
    flag = 12
  }
  
  return ((16 * g) + r) + flag
}

self.off = 0
self.greenLow = self(0,1)
self.greenMed = self(0,2)
self.green = self(0,3)
self.greenFlash = self(0,3, 'flash')
self.redLow = self(1,0)
self.redMed = self(2,0)
self.red = self(3,0)
self.amberLow = self(1,1)
self.amber = self(3,3)
self.yellow = self(1,3)