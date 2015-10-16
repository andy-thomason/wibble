
#define BOOST_ASIO_HAS_MOVE 1
#define BOOST_ASIO_ERROR_CATEGORY_NOEXCEPT noexcept(true)
#define _WIN32_WINNT 0x0501
#define _CRT_SECURE_NO_WARNINGS

#include <boost/asio.hpp>
#include <iostream>
#include <fstream>
#include <vector>
#include <cmath>

#include "../../wibble/wibble.hpp"

class triangle : public wibble::game {
public:
  triangle() {
    scene().
      geometry().
        component().
          vertices()(
            {
              -1.0f, -1.0f, 0.0f,
               0.0f,  1.0f, 0.0f,
              -1.0f, -1.0f, 0.0f,
            }
          ).
        ).
        material()
    ;
  }
private:
};

int main() {
  boost::asio::io_service io;

  wibble::server svr(io);
  svr.add_game(new triangle());
  io.run();
}
